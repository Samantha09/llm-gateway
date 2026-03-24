import { useLogin } from "@refinedev/core";
import { Button, Card, Form, Input, Space, Typography, Alert } from "antd";
import { LockOutlined, UserOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Dropdown } from "antd";
import { languages } from "../i18n";

const { Title, Text } = Typography;

export const LoginPage = () => {
  const { mutateAsync, isLoading, error } = useLogin();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const languageItems = languages.map(lang => ({
    key: lang.code,
    label: lang.nativeName,
    onClick: () => {
      i18n.changeLanguage(lang.code);
    }
  }));

  const onFinish = async (values: { email: string; password: string }) => {
    console.debug("LoginPage: submit", values);
    try {
      const result = await mutateAsync(values);
      console.debug("LoginPage: login success, result:", result);

      const redirectTo = (result as any)?.redirectTo || "/dashboard";
      console.debug("LoginPage: navigating to", redirectTo);

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.debug("LoginPage: login failed", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--refine-sider-background, #f4f4f4)"
      }}
    >
      <Card style={{ width: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={3} style={{ margin: 0 }}>{t("auth.loginTitle")}</Title>
            <Dropdown
              menu={{ items: languageItems, selectedKeys: [i18n.language] }}
              placement="bottomRight"
            >
              <Button type="text" icon={<GlobalOutlined />} size="small">
                {currentLang.nativeName}
              </Button>
            </Dropdown>
          </div>
          <Text type="secondary">Use your control-plane credentials to continue.</Text>
          {error && (
            <Alert
              type="error"
              message={t("auth.loginError")}
              description="Please verify your email and password."
              showIcon
            />
          )}
        </Space>
        <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
          <Form.Item
            label={t("auth.email")}
            name="email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label={t("auth.password")}
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {t("auth.loginButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
