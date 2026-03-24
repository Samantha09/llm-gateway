import { Outlet } from "react-router";
import { ThemedLayout, ThemedSider } from "@refinedev/antd";
import { useTranslate, useMenu } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { Dropdown, Button, Menu } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { languages } from "../../i18n";

export const ConsoleLayout = () => {
  const { i18n } = useTranslation();
  const translate = useTranslate();
  const { menuItems: refineMenuItems } = useMenu();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const languageItems = languages.map(lang => ({
    key: lang.code,
    label: lang.nativeName,
    onClick: () => {
      i18n.changeLanguage(lang.code);
    }
  }));

  // Build menu items with translated labels
  const menuItems = refineMenuItems.map((item) => ({
    key: item.key || item.name,
    label: translate(item.options?.label as string || item.label || item.name),
    icon: item.icon,
  }));

  return (
    <ThemedLayout
      Title={({ collapsed }) => (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          {collapsed ? "LLM" : "LLM Gateway Console"}
        </span>
      )}
      Sider={() => (
        <ThemedSider
          render={(props) => {
            return (
              <Menu
                mode="inline"
                selectedKeys={props.selectedKey ? [props.selectedKey] : []}
                onClick={({ key }) => {
                  const item = refineMenuItems.find(i => (i.key || i.name) === key);
                  if (item?.route) {
                    window.location.href = item.route;
                  }
                }}
                items={menuItems}
                style={{ height: '100%', borderRight: 0 }}
              />
            );
          }}
        />
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
