import { About } from '@/components/sections/About'
import { Contact } from '@/components/sections/Contact'
import { Dieline } from '@/components/sections/Dieline'
import { Flavors, Hero, Ingredients, Pair, PanelNotes, WhatIs } from '@/components/sections/StorySections'
import { Timeline } from '@/components/sections/Timeline'
import { TurnIt } from '@/components/sections/TurnIt'
import { HomeStage } from '@/components/stage/HomeStage'

export default function Home() {
  return (
    <>
      <div id="story" className="relative">
        <HomeStage storyId="story" />
        <Hero />
        <WhatIs />
        <Ingredients />
        <PanelNotes />
        <Flavors />
        <Pair />
        <TurnIt />
      </div>
      <Dieline />
      <About />
      <Timeline />
      <Contact />
    </>
  )
}
