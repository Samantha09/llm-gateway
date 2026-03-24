import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Button, Modal, Form, Input, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

type Project = {
  id: string;
  name: string;
  organization_id: string;
  active: boolean;
};

type Organization = {
  id: string;
  name: string;
};

export const ProjectsPage = () => {
  const t = useTranslate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { tableProps } = useTable<Project>({
    resource: "projects",
    initialPageSize: 10,
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/orgs`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setOrganizations(data))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organizationId: values.organization_id, name: values.name }),
      });
      if (!response.ok) throw new Error("Failed to create");
      message.success(t("common.success"));
      setCreateModalVisible(false);
      createForm.resetFields();
      window.location.reload();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const handleEdit = async () => {
    if (!editingProject) return;
    try {
      const values = await editForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: values.name }),
      });
      if (!response.ok) throw new Error("Failed to update");
      message.success(t("common.success"));
      setEditModalVisible(false);
      setEditingProject(null);
      editForm.resetFields();
      window.location.reload();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
      message.success(t("common.success"));
      window.location.reload();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const openEditModal = (record: Project) => {
    setEditingProject(record);
    editForm.setFieldsValue({ name: record.name });
    setEditModalVisible(true);
  };

  const getOrgName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || orgId;
  };

  return (
    <>
      <List
        title={t("projects.title")}
        canCreate
        createButtonProps={{
          onClick: () => setCreateModalVisible(true),
          icon: <PlusOutlined />,
        }}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title={t("projects.fields.id")} />
          <Table.Column dataIndex="name" title={t("projects.fields.name")} />
          <Table.Column
            dataIndex="organization_id"
            title={t("projects.fields.organization")}
            render={(orgId: string) => getOrgName(orgId)}
          />
          <Table.Column
            dataIndex="active"
            title={t("projects.fields.status")}
            render={(active: boolean) => (
              <Tag color={active ? "green" : "red"}>
                {active ? t("common.active") : t("common.disabled")}
              </Tag>
            )}
          />
          <Table.Column
            title={t("table.actions")}
            dataIndex="actions"
            render={(_, record: Project) => (
              <Space>
                <Button type="link" onClick={() => openEditModal(record)}>
                  {t("buttons.edit")}
                </Button>
                <Button type="link" danger onClick={() => handleDelete(record.id)}>
                  {t("buttons.delete")}
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>

      <Modal
        title={t("projects.create")}
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText={t("buttons.create")}
        cancelText={t("buttons.cancel")}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="organization_id"
            label={t("projects.organization")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Select placeholder={t("projects.organizationPlaceholder")}>
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label={t("common.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("projects.namePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("projects.edit")}
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingProject(null);
          editForm.resetFields();
        }}
        okText={t("buttons.save")}
        cancelText={t("buttons.cancel")}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t("common.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("projects.namePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
