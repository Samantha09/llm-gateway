import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Tag } from "antd";

type Model = {
  id: string;
  name: string;
  family: string;
  free: boolean;
  context_window_tokens: number;
};

export const ModelsPage = () => {
  const t = useTranslate();

  const { tableProps } = useTable<Model>({
    resource: "models",
    initialPageSize: 10,
    meta: { path: "/v1/models" },
  });

  const formatContextWindow = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  };

  return (
    <List title={t("models.title")}>
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
          dataIndex="free"
          title={t("models.fields.free")}
          render={(free: boolean) => (
            <Tag color={free ? "green" : "default"}>
              {free ? t("common.yes") : t("common.no")}
            </Tag>
          )}
        />
      </Table>
    </List>
  );
};
