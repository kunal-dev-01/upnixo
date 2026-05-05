
interface AuthLayoutProps {
  children: React.ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="w-full min-h-screen">
      
      {children}
    </div>
  )
}

export default AuthLayout