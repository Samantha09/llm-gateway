import { Refine, Authenticated } from "@refinedev/core";
import { useNotificationProvider } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";

import { DashboardPage } from "./pages/DashboardPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ApiKeysPage } from "./pages/ApiKeysPage";
import { ModelsPage } from "./pages/ModelsPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProviderKeysPage } from "./pages/ProviderKeysPage";
import { LoginPage } from "./pages/LoginPage";
import { ConsoleLayout } from "./app/layouts/ConsoleLayout";
import { authProvider } from "./app/providers/authProvider";
import { dataProvider } from "./app/providers/dataProvider";
import { accessControlProvider } from "./app/providers/accessControlProvider";
import i18n from "./i18n";

const resourceNames = [
  { name: "dashboard", labelKey: "menu.dashboard" },
  { name: "organizations", labelKey: "menu.organizations" },
  { name: "projects", labelKey: "menu.projects" },
  { name: "api-keys", labelKey: "menu.apiKeys" },
  { name: "provider-keys", labelKey: "menu.providerKeys" },
  { name: "models", labelKey: "menu.models" },
  { name: "logs", labelKey: "menu.logs" },
  { name: "settings", labelKey: "menu.settings" }
] as const;

// Create Refine i18n provider using the i18n instance
const i18nProvider = {
  translate: (key: string, options?: Record<string, unknown>) => {
    return i18n.t(key, options as any);
  },
  changeLocale: (lang: string) => {
    return i18n.changeLanguage(lang);
  },
  getLocale: () => {
    return i18n.language;
  },
};

// Resources with translation keys - Refine will use i18nProvider to translate
const resources = resourceNames.map((resource) => ({
  name: resource.name,
  list: resource.name === "dashboard" ? "/dashboard" : `/${resource.name}`,
  options: { label: resource.labelKey }
}));

const AppContent = () => {
  const { i18n: i18nInstance } = useTranslation();

  // Update dayjs locale when language changes
  const currentLocale = i18nInstance.language === 'zh' ? 'zh-cn' : 'en';
  dayjs.locale(currentLocale);

  return (
    <ConfigProvider
      locale={i18nInstance.language === 'zh' ? zhCN : enUS}
    >
      <AntdApp>
        <Refine
          routerProvider={routerProvider}
          authProvider={authProvider}
          dataProvider={dataProvider}
          accessControlProvider={accessControlProvider}
          i18nProvider={i18nProvider}
          notificationProvider={useNotificationProvider}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true
          }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <Authenticated fallback={<Navigate to="/login" replace />}>
                  <ConsoleLayout />
                </Authenticated>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="provider-keys" element={<ProviderKeysPage />} />
              <Route path="models" element={<ModelsPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};
