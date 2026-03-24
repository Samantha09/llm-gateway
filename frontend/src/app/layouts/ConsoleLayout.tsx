import { Outlet } from "react-router";
import { ThemedLayout } from "@refinedev/antd";
import { useTranslation } from "react-i18next";
import { Dropdown, Button, Space } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { languages } from "../../i18n";

export const ConsoleLayout = () => {
  const { i18n, t } = useTranslation();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const languageItems = languages.map(lang => ({
    key: lang.code,
    label: lang.nativeName,
    onClick: () => {
      i18n.changeLanguage(lang.code);
    }
  }));

  return (
    <ThemedLayout
      Title={({ collapsed }) => (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          {collapsed ? "LLM" : "LLM Gateway Console"}
        </span>
      )}
      Header={() => (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 16px",
          height: "48px",
          lineHeight: "48px",
          gap: 12
        }}>
          <Dropdown
            menu={{ items: languageItems, selectedKeys: [i18n.language] }}
            placement="bottomRight"
          >
            <Button type="text" icon={<GlobalOutlined />} size="small">
              {currentLang.nativeName}
            </Button>
          </Dropdown>
        </div>
      )}
    >
      <Outlet />
    </ThemedLayout>
  );
};
