export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Apenas uma div para centralizar o card, herdando o HTML/Body do RootLayout
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      {children}
    </div>
  )
}