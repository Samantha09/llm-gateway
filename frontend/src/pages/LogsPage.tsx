import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Tag, Button, Modal, Descriptions } from "antd";
import { useState } from "react";

type LogEntry = {
  id: string;
  request_id: string;
  path: string;
  provider_id: string;
  http_status: number;
  latency_ms: number;
  estimated_cost_micros_usd: number;
};

export const LogsPage = () => {
  const t = useTranslate();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const { tableProps } = useTable<LogEntry>({
    resource: "logs",
    initialPageSize: 20,
  });

  const formatCost = (micros?: number) => {
    if (!micros) return "0µ$";
    if (micros >= 1000) return `${(micros / 1000).toFixed(2)}m$`;
    return `${micros.toFixed(2)}µ$`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "green";
    if (status >= 400 && status < 500) return "orange";
    if (status >= 500) return "red";
    return "default";
  };

  const viewDetails = (record: LogEntry) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  return (
    <>
      <List title={t("logs.title")}>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="request_id" title={t("logs.fields.requestId")} width={200} />
          <Table.Column dataIndex="path" title={t("logs.fields.path")} />
          <Table.Column dataIndex="provider_id" title={t("logs.fields.provider")} width={120} />
          <Table.Column
            dataIndex="http_status"
            title={t("logs.fields.httpStatus")}
            width={100}
            render={(status: number) => (
              <Tag color={getStatusColor(status)}>{status}</Tag>
            )}
          />
          <Table.Column
            dataIndex="latency_ms"
            title={t("logs.fields.latency")}
            width={100}
            render={(ms: number) => `${ms}ms`}
          />
          <Table.Column
            dataIndex="estimated_cost_micros_usd"
            title={t("logs.fields.cost")}
            width={100}
            render={(cost: number) => formatCost(cost)}
          />
          <Table.Column
            title={t("table.actions")}
            width={100}
            render={(_, record: LogEntry) => (
              <Button type="link" onClick={() => viewDetails(record)}>
                {t("buttons.view")}
              </Button>
            )}
          />
        </Table>
      </List>

      <Modal
        title={t("logs.viewDetails")}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={null}
        width={600}
      >
        {selectedLog && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t("logs.fields.requestId")}>
              {selectedLog.request_id}
            </Descriptions.Item>
            <Descriptions.Item label={t("logs.fields.path")}>
              {selectedLog.path}
            </Descriptions.Item>
            <Descriptions.Item label={t("logs.fields.provider")}>
              {selectedLog.provider_id}
            </Descriptions.Item>
            <Descriptions.Item label={t("logs.fields.httpStatus")}>
              <Tag color={getStatusColor(selectedLog.http_status)}>
                {selectedLog.http_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t("logs.fields.latency")}>
              {selectedLog.latency_ms}ms
            </Descriptions.Item>
            <Descriptions.Item label={t("logs.fields.cost")}>
              {formatCost(selectedLog.estimated_cost_micros_usd)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};
