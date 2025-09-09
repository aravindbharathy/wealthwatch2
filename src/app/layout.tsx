import "./globals.css";
import MainLayout from "../components/MainLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
