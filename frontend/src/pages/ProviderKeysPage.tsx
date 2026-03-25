import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Button, Modal, Form, Input, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

type ProviderKey = {
  id: string;
  name: string;
  provider_id: string;
  active: boolean;
  organization_id: string;
  created_at?: string;
};

type Organization = {
  id: string;
  name: string;
};

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
];

export const ProviderKeysPage = () => {
  const t = useTranslate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<ProviderKey | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { tableProps } = useTable<ProviderKey>({
    resource: "provider-keys",
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
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          provider_id: values.provider_id,
          api_key_value: values.api_key_value,
          organization_id: values.organization_id,
        }),
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
    if (!editingKey) return;
    try {
      const values = await editForm.validateFields();
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/provider/${editingKey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          api_key_value: values.api_key_value,
          active: values.active,
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
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8081"}/keys/provider/${id}`, {
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

  const openEditModal = (record: ProviderKey) => {
    setEditingKey(record);
    editForm.setFieldsValue({
      name: record.name,
      api_key_value: "",
      active: record.active,
    });
    setEditModalVisible(true);
  };

  const getOrgName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || orgId;
  };

  const getProviderLabel = (providerId: string) => {
    const provider = PROVIDER_OPTIONS.find((p) => p.value === providerId);
    return provider?.label || providerId;
  };

  return (
    <>
      <List
        title={t("providerKeys.title")}
        canCreate
        createButtonProps={{
          onClick: () => setCreateModalVisible(true),
          icon: <PlusOutlined />,
        }}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title={t("providerKeys.fields.id")} width={100} />
          <Table.Column dataIndex="name" title={t("providerKeys.fields.name")} />
          <Table.Column
            dataIndex="provider_id"
            title={t("providerKeys.fields.provider")}
            render={(providerId: string) => getProviderLabel(providerId)}
          />
          <Table.Column
            dataIndex="organization_id"
            title={t("projects.organization")}
            render={(orgId: string) => getOrgName(orgId)}
          />
          <Table.Column
            dataIndex="active"
            title={t("providerKeys.fields.status")}
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
            render={(_, record: ProviderKey) => (
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
        title={t("providerKeys.title") + " - " + t("buttons.create")}
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
            label={t("common.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("common.name")} />
          </Form.Item>
          <Form.Item
            name="provider_id"
            label={t("providerKeys.fields.provider")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Select placeholder={t("common.select")}>
              {PROVIDER_OPTIONS.map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  {p.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="api_key_value"
            label={t("providerKeys.apiKey")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input.Password placeholder={t("providerKeys.apiKeyPlaceholder")} />
          </Form.Item>
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
        </Form>
      </Modal>

      <Modal
        title={t("providerKeys.title") + " - " + t("buttons.edit")}
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
          <Form.Item
            name="api_key_value"
            label={t("providerKeys.apiKey")}
          >
            <Input.Password placeholder={t("providerKeys.apiKeyPlaceholder")} />
          </Form.Item>
          <Form.Item name="active" label={t("common.status")}>
            <Select>
              <Select.Option value={true}>{t("common.active")}</Select.Option>
              <Select.Option value={false}>{t("common.disabled")}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
