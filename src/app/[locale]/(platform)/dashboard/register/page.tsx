// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </main>
  )
}
