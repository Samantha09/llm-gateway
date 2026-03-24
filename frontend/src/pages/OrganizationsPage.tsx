import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

type Organization = {
  id: string;
  name: string;
  active: boolean;
};

export const OrganizationsPage = () => {
  const t = useTranslate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { tableProps } = useTable<Organization>({
    resource: "organizations",
    initialPageSize: 10,
  });

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/orgs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: values.name }),
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
    if (!editingOrg) return;
    try {
      const values = await editForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/orgs/${editingOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: values.name }),
      });
      if (!response.ok) throw new Error("Failed to update");
      message.success(t("common.success"));
      setEditModalVisible(false);
      setEditingOrg(null);
      editForm.resetFields();
      window.location.reload();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/orgs/${id}`, {
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

  const openEditModal = (record: Organization) => {
    setEditingOrg(record);
    editForm.setFieldsValue({ name: record.name });
    setEditModalVisible(true);
  };

  return (
    <>
      <List
        title={t("organizations.title")}
        canCreate
        createButtonProps={{
          onClick: () => setCreateModalVisible(true),
          icon: <PlusOutlined />,
        }}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title={t("organizations.fields.id")} />
          <Table.Column dataIndex="name" title={t("organizations.fields.name")} />
          <Table.Column
            dataIndex="active"
            title={t("organizations.fields.status")}
            render={(active: boolean) => (
              <Tag color={active ? "green" : "red"}>
                {active ? t("organizations.status.active") : t("organizations.status.disabled")}
              </Tag>
            )}
          />
          <Table.Column
            title={t("table.actions")}
            dataIndex="actions"
            render={(_, record: Organization) => (
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
        title={t("organizations.create")}
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
            name="name"
            label={t("organizations.fields.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("organizations.namePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("organizations.edit")}
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingOrg(null);
          editForm.resetFields();
        }}
        okText={t("buttons.save")}
        cancelText={t("buttons.cancel")}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t("organizations.fields.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
