import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
// @ts-ignore — no type declarations for this CSS-only export
import '@payloadcms/next/css'
import '../custom-admin.css'
import type { ServerFunctionClient } from 'payload'
import React from 'react'
import { importMap } from './admin/importMap'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = async ({ children }: { children: React.ReactNode }) =>
  RootLayout({ children, config, importMap, serverFunction })

export default Layout
