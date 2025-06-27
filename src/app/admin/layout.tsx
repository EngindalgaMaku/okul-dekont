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
  Calendar,
  Shield,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'Ana Panel', href: '/admin', icon: Home },
  { name: 'Alan Yönetimi', href: '/admin/alanlar', icon: Briefcase },
  { name: 'İşletme Yönetimi', href: '/admin/isletmeler', icon: Building },
  { name: 'Öğretmen Yönetimi', href: '/admin/ogretmenler', icon: Users },
  { name: 'Dekont Yönetimi', href: '/admin/dekontlar', icon: FileText },
]

const settingsNavigation = [
  { name: 'Sistem Ayarları', href: '/admin/ayarlar', icon: Settings },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [matches, query])

  return matches
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  
  // Tablet ve daha küçük ekranlar için media query
  const isTabletOrSmaller = useMediaQuery('(max-width: 1279px)')

  // Tablet/mobil cihazlarda sidebar'ı otomatik küçült
  useEffect(() => {
    if (isTabletOrSmaller) {
      setDesktopSidebarOpen(false)
    } else {
      setDesktopSidebarOpen(true)
    }
  }, [isTabletOrSmaller])

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
          <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 flex z-40">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <X className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex-shrink-0 flex items-center px-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-800">Admin Paneli</span>
                  </div>
                  <div className="mt-5 flex-1 h-0 overflow-y-auto flex flex-col">
                    <nav className="px-2 space-y-1 flex-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border-r-2 border-indigo-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    
                    {/* Ayarlar Bölümü */}
                    <div className="px-2 pt-4 border-t border-gray-200">
                      <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Ayarlar
                      </p>
                      {settingsNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                              ? 'bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-600 border-r-2 border-orange-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
              <div className="flex-shrink-0 w-14" aria-hidden="true">
                {/* Dummy element to force sidebar to shrink to fit close icon */}
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop and tablet */}
        <div className={classNames(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300",
          desktopSidebarOpen ? "lg:w-64" : "lg:w-16"
        )}>
          <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto shadow-lg">
            <div className={classNames(
              "flex items-center flex-shrink-0 pb-4 transition-all duration-300",
              desktopSidebarOpen ? "px-4" : "px-2 justify-center"
            )}>
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {desktopSidebarOpen && (
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Admin Paneli</span>
              )}
              <button
                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                className={classNames(
                  "p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200",
                  desktopSidebarOpen ? "ml-auto" : "ml-0"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {desktopSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  )}
                </svg>
              </button>
            </div>
            <div className="border-t border-gray-100 pt-4 flex-grow flex flex-col">
              <nav className={classNames(
                "flex-1 pb-4 space-y-2 transition-all duration-300",
                desktopSidebarOpen ? "px-2" : "px-1"
              )}>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border-r-4 border-indigo-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm',
                      'group flex items-center text-sm font-medium rounded-l-lg transition-all duration-200',
                      desktopSidebarOpen ? 'px-3 py-3' : 'px-2 py-3 justify-center'
                    )}
                    title={!desktopSidebarOpen ? item.name : undefined}
                  >
                    <item.icon
                      className={classNames(
                        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                        'flex-shrink-0 h-5 w-5',
                        desktopSidebarOpen ? 'mr-3' : ''
                      )}
                      aria-hidden="true"
                    />
                    {desktopSidebarOpen && item.name}
                  </Link>
                ))}
              </nav>
              
              {/* Ayarlar Bölümü */}
              <div className={classNames(
                "border-t border-gray-100 pt-2 pb-2 transition-all duration-300",
                desktopSidebarOpen ? "px-2" : "px-1"
              )}>
                {desktopSidebarOpen && (
                  <p className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Ayarlar
                  </p>
                )}
                {settingsNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-600 border-r-4 border-orange-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm',
                      'group flex items-center text-sm font-medium rounded-l-lg transition-all duration-200',
                      desktopSidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center'
                    )}
                    title={!desktopSidebarOpen ? item.name : undefined}
                  >
                    <item.icon
                      className={classNames(
                        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500',
                        'flex-shrink-0 h-5 w-5',
                        desktopSidebarOpen ? 'mr-3' : ''
                      )}
                      aria-hidden="true"
                    />
                    {desktopSidebarOpen && item.name}
                  </Link>
                ))}
              </div>
              <div className={classNames(
                "border-t border-gray-100 transition-all duration-300",
                desktopSidebarOpen ? "p-2" : "p-1"
              )}>
                <button
                    onClick={handleLogout}
                    className={classNames(
                      "w-full group flex items-center text-sm font-medium rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200",
                      desktopSidebarOpen ? "px-3 py-3" : "px-2 py-3 justify-center"
                    )}
                    title={!desktopSidebarOpen ? "Çıkış Yap" : undefined}
                >
                    <LogOut className={classNames(
                      "h-5 w-5 text-gray-400 group-hover:text-red-500",
                      desktopSidebarOpen ? "mr-3" : ""
                    )} />
                    {desktopSidebarOpen && "Çıkış Yap"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={classNames(
          "flex flex-col flex-1 bg-gray-50 min-h-screen transition-all duration-300",
          desktopSidebarOpen ? "lg:pl-64" : "lg:pl-16"
        )}>
          <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow-sm">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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