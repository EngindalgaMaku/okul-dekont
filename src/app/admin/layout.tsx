'use client'

import { useEffect, useState, Fragment, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import {
  Home,
  Menu,
  X,
  Building,
  Users,
  Briefcase,
  FileText,
  LogOut,
  Calendar
} from 'lucide-react'

const navigation = [
  { name: 'Ana Panel', href: '/admin', icon: Home },
  { name: 'Eğitim Yılı', href: '/admin/egitim-yili', icon: Calendar },
  { name: 'Alan Yönetimi', href: '/admin/alanlar', icon: Briefcase },
  { name: 'İşletme Yönetimi', href: '/admin/isletmeler', icon: Building },
  { name: 'Öğretmen Yönetimi', href: '/admin/ogretmenler', icon: Users },
  { name: 'Dekont Yönetimi', href: '/admin/dekontlar', icon: FileText },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin-auth')
    if (authStatus === 'true') {
      setIsAuth(true)
    } else {
      if (pathname !== '/admin/login') {
        router.push('/admin/login')
      }
    }
  }, [pathname, router])
  
  const handleLogout = () => {
    sessionStorage.removeItem('admin-auth');
    router.push('/admin/login');
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!isAuth) {
    return null
  }

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
            {/* ... Mobile sidebar overlay and content ... */}
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
               <FileText className="h-8 w-8 text-emerald-600" />
               <span className="ml-3 text-xl font-bold text-gray-800">Admin Paneli</span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      pathname.startsWith(item.href)
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        pathname.startsWith(item.href) ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-gray-200 p-2">
                <button
                    onClick={handleLogout}
                    className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    <LogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:pl-64 flex flex-col flex-1">
          <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
} 