import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Tag, Space, Tooltip, Button, Modal, Form, Input, InputNumber, Switch, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

type Model = {
  id: string;
  name: string;
  family: string;
  free_model: boolean;
  builtin: boolean;
  supports_vision: boolean;
  supports_tools: boolean;
  supports_reasoning: boolean;
  supports_streaming: boolean;
  image_generation: boolean;
  context_window_tokens: number;
  input_cost_micros_per_token: number;
  output_cost_micros_per_token: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

export const ModelsPage = () => {
  const t = useTranslate();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { tableProps, refetch } = useTable<Model>({
    resource: "models",
    initialPageSize: 10,
    meta: { path: "/v1/models" },
  });

  const formatContextWindow = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await fetch(`${API_URL}/v1/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: values.id,
          name: values.name,
          family: values.family,
          free_model: values.free_model ?? false,
          supports_vision: values.supports_vision ?? false,
          supports_tools: values.supports_tools ?? false,
          supports_reasoning: values.supports_reasoning ?? false,
          supports_streaming: values.supports_streaming ?? true,
          image_generation: values.image_generation ?? false,
          context_window_tokens: values.context_window_tokens ?? 0,
          input_cost_micros_per_token: values.input_cost_micros_per_token ?? 0,
          output_cost_micros_per_token: values.output_cost_micros_per_token ?? 0,
        }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      message.success(t("common.success"));
      setCreateModalVisible(false);
      createForm.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    }
  };

  const handleEdit = async () => {
    if (!editingModel) return;
    try {
      const values = await editForm.validateFields();
      const response = await fetch(`${API_URL}/v1/models/${editingModel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          family: values.family,
          free_model: values.free_model,
          supports_vision: values.supports_vision,
          supports_tools: values.supports_tools,
          supports_reasoning: values.supports_reasoning,
          supports_streaming: values.supports_streaming,
          image_generation: values.image_generation,
          context_window_tokens: values.context_window_tokens,
          input_cost_micros_per_token: values.input_cost_micros_per_token,
          output_cost_micros_per_token: values.output_cost_micros_per_token,
        }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      message.success(t("common.success"));
      setEditModalVisible(false);
      setEditingModel(null);
      editForm.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/v1/models/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      message.success(t("common.success"));
      refetch();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    }
  };

  const openEditModal = (record: Model) => {
    setEditingModel(record);
    editForm.setFieldsValue({
      name: record.name,
      family: record.family,
      free_model: record.free_model,
      supports_vision: record.supports_vision,
      supports_tools: record.supports_tools,
      supports_reasoning: record.supports_reasoning,
      supports_streaming: record.supports_streaming,
      image_generation: record.image_generation,
      context_window_tokens: record.context_window_tokens,
      input_cost_micros_per_token: record.input_cost_micros_per_token,
      output_cost_micros_per_token: record.output_cost_micros_per_token,
    });
    setEditModalVisible(true);
  };

  return (
    <>
      <List
        title={t("models.title")}
        canCreate
        createButtonProps={{
          onClick: () => setCreateModalVisible(true),
          icon: <PlusOutlined />,
        }}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title={t("models.fields.id")} width={200} />
          <Table.Column dataIndex="name" title={t("models.fields.name")} />
          <Table.Column dataIndex="family" title={t("models.fields.family")} />
          <Table.Column
            dataIndex="context_window_tokens"
            title={t("models.fields.contextWindow")}
            render={(tokens: number) => formatContextWindow(tokens)}
          />
          <Table.Column
            dataIndex="free_model"
            title={t("models.fields.free")}
            render={(free: boolean) => (
              <Tag color={free ? "green" : "default"}>
                {free ? t("common.yes") : t("common.no")}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="builtin"
            title={t("models.fields.builtin")}
            render={(builtin: boolean) => (
              <Tag color={builtin ? "blue" : "default"}>
                {builtin ? t("common.yes") : t("common.no")}
              </Tag>
            )}
          />
          <Table.Column
            title={t("table.actions")}
            fixed="right"
            render={(_, record: Model) => (
              <Space>
                {!record.builtin ? (
                  <>
                    <Button type="link" onClick={() => openEditModal(record)}>
                      {t("buttons.edit")}
                    </Button>
                    <Button type="link" danger onClick={() => handleDelete(record.id)}>
                      {t("buttons.delete")}
                    </Button>
                  </>
                ) : (
                  <Tooltip title={t("models.builtinNotEditable")}>
                    <span style={{ color: "#999", fontSize: "12px" }}>
                      {t("models.builtin")}
                    </span>
                  </Tooltip>
                )}
              </Space>
            )}
          />
        </Table>
      </List>

      {/* Create Modal */}
      <Modal
        title={t("models.title") + " - " + t("buttons.create")}
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText={t("buttons.create")}
        cancelText={t("buttons.cancel")}
        width={600}
      >
        <Form form={createForm} layout="vertical" initialValues={{ supports_streaming: true }}>
          <Form.Item
            name="id"
            label={t("models.fields.id")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder="e.g. my-custom-model" />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("models.fields.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder="e.g. My Custom Model" />
          </Form.Item>
          <Form.Item
            name="family"
            label={t("models.fields.family")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder="e.g. custom" />
          </Form.Item>
          <Form.Item name="context_window_tokens" label={t("models.contextWindow")}>
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
          <Form.Item name="input_cost_micros_per_token" label={t("models.inputCost")}>
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
          <Form.Item name="output_cost_micros_per_token" label={t("models.outputCost")}>
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
          <Form.Item name="free_model" label={t("models.fields.free")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_vision" label={t("models.supportsVision")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_tools" label={t("models.supportsTools")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_reasoning" label={t("models.supportsReasoning")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_streaming" label={t("models.supportsStreaming")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="image_generation" label={t("models.imageGeneration")} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={t("models.title") + " - " + t("buttons.edit")}
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingModel(null);
          editForm.resetFields();
        }}
        okText={t("buttons.save")}
        cancelText={t("buttons.cancel")}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t("models.fields.name")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="family"
            label={t("models.fields.family")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="context_window_tokens" label={t("models.contextWindow")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="input_cost_micros_per_token" label={t("models.inputCost")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="output_cost_micros_per_token" label={t("models.outputCost")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="free_model" label={t("models.fields.free")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_vision" label={t("models.supportsVision")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_tools" label={t("models.supportsTools")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_reasoning" label={t("models.supportsReasoning")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="supports_streaming" label={t("models.supportsStreaming")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="image_generation" label={t("models.imageGeneration")} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
