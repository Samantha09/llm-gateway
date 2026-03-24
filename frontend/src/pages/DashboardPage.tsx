import { Card, Col, List, Row, Statistic, Typography } from "antd";
import { useList } from "@refinedev/core";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export const DashboardPage = () => {
  const { t } = useTranslation();

  const { data: orgResponse } = useList({ resource: "organizations" });
  const { data: projectResponse } = useList({ resource: "projects" });
  const { data: keysResponse } = useList({ resource: "api-keys" });
  const { data: logsResponse } = useList({ resource: "logs", config: { pagination: { pageSize: 5 } } });

  const orgCount = orgResponse?.data.length ?? 0;
  const projectCount = projectResponse?.data.length ?? 0;
  const keyCount = keysResponse?.data.length ?? 0;
  const logCount = logsResponse?.data.length ?? 0;
  const recentLogs = logsResponse?.data ?? [];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("dashboard.organizations")}
              value={orgCount}
              suffix={t("dashboard.organizationsDesc")}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("dashboard.projects")}
              value={projectCount}
              suffix={t("dashboard.projectsDesc")}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("dashboard.apiKeys")}
              value={keyCount}
              suffix={t("dashboard.apiKeysDesc")}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("dashboard.recentLogs")}
              value={logCount}
              suffix={t("dashboard.recentLogsDesc")}
            />
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }} gutter={[16, 16]}>
        <Col span={24}>
          <Card title={t("dashboard.latestLogs")}>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                {t("common.noData")}
              </div>
            ) : (
              <List
                dataSource={recentLogs}
                rowKey={(item) => item.request_id}
                renderItem={(item) => (
                  <List.Item>
                    <Text strong>{item.request_id}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {item.path}
                    </Text>
                    <Text style={{ marginLeft: "auto" }}>
                      {item.http_status} · {item.provider_id} · {item.estimated_cost_micros_usd}µ$
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};
