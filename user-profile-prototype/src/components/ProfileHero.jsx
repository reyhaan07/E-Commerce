import React from 'react'

// Wide blue/purple banner at the top of the main content area.
export default function ProfileHero({ name }) {
  return (
    <section className="hero">
      <h1>{name}</h1>
      <p>Manage your personal information and account settings</p>
    </section>
  )
}
