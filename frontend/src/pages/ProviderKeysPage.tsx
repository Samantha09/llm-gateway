import { useTranslate } from "@refinedev/core";
import { List, useTable } from "@refinedev/antd";
import { Table, Tag } from "antd";

type ProviderKey = {
  id: string;
  name: string;
  provider_id: string;
  active: boolean;
};

export const ProviderKeysPage = () => {
  const t = useTranslate();

  const { tableProps } = useTable<ProviderKey>({
    resource: "provider-keys",
    initialPageSize: 10,
  });

  return (
    <List title={t("providerKeys.title")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title={t("providerKeys.fields.id")} />
        <Table.Column dataIndex="name" title={t("providerKeys.fields.name")} />
        <Table.Column dataIndex="provider_id" title={t("providerKeys.fields.provider")} />
        <Table.Column
          dataIndex="active"
          title={t("providerKeys.fields.status")}
          render={(active: boolean) => (
            <Tag color={active ? "green" : "red"}>
              {active ? t("common.active") : t("common.disabled")}
            </Tag>
          )}
        />
      </Table>
    </List>
  );
};
