import { useTranslate } from "@refinedev/core";
import { Card, Descriptions, Spin, Typography } from "antd";
import { useGetIdentity } from "@refinedev/core";

const { Title } = Typography;

type UserIdentity = {
  id?: string;
  fullName?: string;
  email?: string;
};

export const SettingsPage = () => {
  const t = useTranslate();
  const { data, isLoading } = useGetIdentity<UserIdentity>();

  return (
    <Card>
      <Title level={4}>{t("settings.title")}</Title>
      {isLoading ? (
        <Spin />
      ) : (
        <Descriptions column={1} bordered style={{ marginTop: 16 }}>
          <Descriptions.Item label={t("settings.fields.userId")}>
            {data?.id ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("settings.fields.name")}>
            {data?.fullName ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("settings.fields.email")}>
            {data?.email ?? "-"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
};
