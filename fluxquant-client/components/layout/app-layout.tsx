import { AppHeader, type HeaderVariant } from "./app-header";
import { PageContainer } from "./page-container";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Header 变体 */
  variant?: HeaderVariant;
  /** 页面标题 */
  title?: string;
  /** 页面徽章 */
  badge?: {
    text: string;
    className?: string;
  };
  /** 返回链接 */
  backHref?: string;
  /** Header 操作区域 */
  headerActions?: React.ReactNode;
  /** 是否正在刷新 */
  isFetching?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 是否显示实时指示器 */
  showLiveIndicator?: boolean;
  /** 页面容器最大宽度 */
  maxWidth?: MaxWidth;
  /** 页面容器额外样式 */
  containerClassName?: string;
}

export function AppLayout({
  children,
  variant = "default",
  title,
  badge,
  backHref,
  headerActions,
  isFetching,
  onRefresh,
  showLiveIndicator,
  maxWidth = "full",
  containerClassName,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <AppHeader
        variant={variant}
        title={title}
        badge={badge}
        backHref={backHref}
        actions={headerActions}
        isFetching={isFetching}
        onRefresh={onRefresh}
        showLiveIndicator={showLiveIndicator}
      />
      <PageContainer maxWidth={maxWidth} className={containerClassName}>
        {children}
      </PageContainer>
    </div>
  );
}
