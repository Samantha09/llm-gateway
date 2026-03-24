import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Typography } from "antd";
import { PlusOutlined, CopyOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

const { Text, Paragraph } = Typography;

type ApiKey = {
  id: string;
  name: string;
  project_id: string;
  organization_id: string;
  active: boolean;
  token_prefix: string;
  spent_micros_usd?: number;
  budget_micros_usd?: number;
  requests_per_minute_limit?: number;
};

type Organization = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  organization_id: string;
};

export const ApiKeysPage = () => {
  const t = useTranslate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [newToken, setNewToken] = useState<string>("");
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { tableProps } = useTable<ApiKey>({
    resource: "api-keys",
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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/projects`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  const filteredProjects = selectedOrgId
    ? projects.filter((p) => p.organization_id === selectedOrgId)
    : projects;

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId: values.organization_id,
          projectId: values.project_id,
          name: values.name,
        }),
      });
      if (!response.ok) throw new Error("Failed to create");
      const data = await response.json();
      setNewToken(data.token);
      setTokenModalVisible(true);
      message.success(t("common.success"));
      setCreateModalVisible(false);
      createForm.resetFields();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const handleEdit = async () => {
    if (!editingKey) return;
    try {
      const values = await editForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/api/${editingKey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          active: values.active,
          budget_micros_usd: values.budget_micros_usd ? values.budget_micros_usd * 1000000 : null,
          requests_per_minute_limit: values.requests_per_minute_limit,
        }),
      });
      if (!response.ok) throw new Error("Failed to update");
      message.success(t("common.success"));
      setEditModalVisible(false);
      setEditingKey(null);
      editForm.resetFields();
      window.location.reload();
    } catch (error) {
      message.error(t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/api/${id}`, {
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

  const openEditModal = (record: ApiKey) => {
    setEditingKey(record);
    editForm.setFieldsValue({
      name: record.name,
      active: record.active,
      budget_micros_usd: record.budget_micros_usd ? record.budget_micros_usd / 1000000 : null,
      requests_per_minute_limit: record.requests_per_minute_limit,
    });
    setEditModalVisible(true);
  };

  const getOrgName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || orgId;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || projectId;
  };

  const formatCost = (micros?: number) => {
    if (!micros) return "$0.00";
    return `$${(micros / 1000000).toFixed(4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t("common.copied"));
  };

  return (
    <>
      <List
        title={t("apiKeys.title")}
        canCreate
        createButtonProps={{
          onClick: () => setCreateModalVisible(true),
          icon: <PlusOutlined />,
        }}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title={t("apiKeys.fields.id")} width={100} />
          <Table.Column dataIndex="name" title={t("apiKeys.fields.name")} />
          <Table.Column dataIndex="token_prefix" title={t("apiKeys.fields.tokenPrefix")} />
          <Table.Column
            dataIndex="organization_id"
            title={t("apiKeys.fields.organization")}
            render={(orgId: string) => getOrgName(orgId)}
          />
          <Table.Column
            dataIndex="project_id"
            title={t("apiKeys.fields.project")}
            render={(projectId: string) => getProjectName(projectId)}
          />
          <Table.Column
            dataIndex="spent_micros_usd"
            title={t("apiKeys.fields.spent")}
            render={(val: number) => formatCost(val)}
          />
          <Table.Column
            dataIndex="active"
            title={t("apiKeys.fields.status")}
            render={(active: boolean) => (
              <Tag color={active ? "green" : "red"}>
                {active ? t("common.active") : t("common.disabled")}
              </Tag>
            )}
          />
          <Table.Column
            title={t("table.actions")}
            dataIndex="actions"
            width={150}
            render={(_, record: ApiKey) => (
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
        title={t("apiKeys.create")}
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          setSelectedOrgId("");
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
            <Select
              placeholder={t("projects.organizationPlaceholder")}
              onChange={(val) => {
                setSelectedOrgId(val);
                createForm.setFieldValue("project_id", undefined);
              }}
            >
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="project_id"
            label={t("apiKeys.fields.project")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Select placeholder={t("apiKeys.projectPlaceholder")}>
              {filteredProjects.map((proj) => (
                <Select.Option key={proj.id} value={proj.id}>
                  {proj.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label={t("common.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("apiKeys.namePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("apiKeys.edit")}
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingKey(null);
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
            <Input />
          </Form.Item>
          <Form.Item name="active" label={t("common.status")} valuePropName="checked">
            <Select>
              <Select.Option value={true}>{t("common.active")}</Select.Option>
              <Select.Option value={false}>{t("common.disabled")}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="budget_micros_usd" label={t("apiKeys.budget") + " (USD)"}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="requests_per_minute_limit" label={t("apiKeys.rateLimit")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("apiKeys.token")}
        open={tokenModalVisible}
        onCancel={() => {
          setTokenModalVisible(false);
          setNewToken("");
          window.location.reload();
        }}
        footer={[
          <Button key="close" onClick={() => {
            setTokenModalVisible(false);
            setNewToken("");
            window.location.reload();
          }}>
            {t("buttons.confirm")}
          </Button>,
        ]}
      >
        <Paragraph type="warning">{t("apiKeys.tokenWarning")}</Paragraph>
        <Paragraph copyable={{ text: newToken }}>
          <Text code style={{ wordBreak: "break-all" }}>{newToken}</Text>
        </Paragraph>
      </Modal>
    </>
  );
};
