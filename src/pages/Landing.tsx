'use client';

import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { MohallaBrandLink, MohallaBrandMark } from '@/components/brand/mohalla-brand';
import { 
  ShieldCheck, 
  ShoppingBag, 
  MessageSquare, 
  MapPin, 
  Building, 
  ArrowRight,
  Sparkles,
  ChevronDown,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Users,
  Bell,
  HelpCircle,
  Megaphone
} from 'lucide-react';

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <MohallaBrandLink markClassName="h-9 w-9 rounded-xl" labelClassName="text-xl tracking-tight" />
        <nav className="hidden items-center gap-6 text-sm font-bold text-muted-foreground md:flex">
          <a href="#preview" className="hover:text-foreground">Preview</a>
          <a href="#safety" className="hover:text-foreground">Safety</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Create community</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  // Tabs for Interactive Preview
  const [activePreviewTab, setActivePreviewTab] = useState<'board' | 'bazaar' | 'directory'>('board');

  // FAQ Accordion State (stores the index of the open question, or null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I register my housing society on Mohalla?",
      a: "Simply click 'Create your community' in the hero section, enter your society name, city, area, and estimated number of units. As the creator, you will automatically be registered as the Admin. You can then invite residents by sharing your society's search name."
    },
    {
      q: "How does the resident verification process work?",
      a: "To maintain security, new residents who register to join your society enter a 'pending' state. They cannot see any society data, listings, or phone numbers until you, the Administrator, verify their identity and unit number and click 'Approve'."
    },
    {
      q: "Are my personal contact details safe from outsiders?",
      a: "Yes, completely. Mohalla is built with strict privacy walls. No one outside of your approved neighborhood can search, view, or interact with your community, your listings, or your profile details."
    },
    {
      q: "Is Mohalla free to use for our neighborhood?",
      a: "Yes! The core community features—including the notice board, local bazaar, and neighbor directory—are 100% free to use for all housing societies, mohallas, and apartment buildings in Pakistan."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 bg-gradient-to-b from-accent/50 via-background to-background">
        {/* Background glowing blobs */}
        <div className="absolute top-1/4 right-0 -mr-24 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 left-0 -ml-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Text & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-wide uppercase animate-float">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Pakistan&apos;s Neighborhood Network</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl font-black text-foreground leading-[1.1] font-headings">
                Your neighborhood. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Connected.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-body max-w-2xl mx-auto lg:mx-0">
                Buy, sell, share, and connect with your verified neighbors in housing societies, apartments, and mohallas across Pakistan. Keep your society safe and active.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/register?path=create" className="w-full sm:w-auto">
                  <Button variant="default" size="lg" className="w-full shadow-lg shadow-primary/20 group h-14 rounded-2xl text-base px-8 font-black">
                    Create your community
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
                <Link href="/register?path=join" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full bg-white/60 backdrop-blur-sm h-14 rounded-2xl text-base px-8 font-bold border-border hover:bg-white hover:border-primary/30 transition-all">
                    Join existing
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground/80 pt-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
                  <span>100% Verified Residents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-accent" />
                  <span>No Outsiders or Spam</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Mockup / Floating Cards */}
            <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
              
              {/* Decorative background glow behind mockup */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-3xl blur-2xl -m-4 -z-10" />

              {/* Main App Dashboard Mockup (Visual Shell) */}
              <div className="relative bg-white rounded-3xl border border-border/80 shadow-2xl p-6 overflow-hidden animate-float">
                {/* Mock Phone/UI Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <MohallaBrandMark animated className="h-9 w-9 rounded-xl" />
                    <div>
                      <h4 className="font-headings font-black text-sm text-foreground">Mohalla App</h4>
                      <p className="text-[10px] font-semibold text-muted-foreground">Askari 11, Lahore</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase border border-emerald-100 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                {/* Dashboard Notice Preview */}
                <div className="space-y-4">
                  <div className="p-4 bg-accent/40 rounded-2xl border border-primary/10 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded">Notice Board</span>
                      <span className="text-[10px] font-bold text-muted-foreground">2 mins ago</span>
                    </div>
                    <h5 className="text-xs font-black text-foreground">Dengue Spray Drive Scheduled</h5>
                    <p className="text-[11px] text-muted-foreground/95 mt-1 leading-relaxed">
                      Dengue fogging spray will be carried out tomorrow at 5:00 PM. Please close all windows.
                    </p>
                    <div className="text-[9px] font-bold text-primary/80 mt-2">Posted by: Society Management</div>
                  </div>

                  {/* Marketplace Preview Item */}
                  <div className="p-4 bg-white rounded-2xl border border-border shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded">Mohalla Bazaar</span>
                      <h5 className="text-xs font-black text-foreground mt-1.5">Unused Infant Baby Crib</h5>
                      <p className="text-sm font-black text-accent mt-0.5">Rs. 6,500</p>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-xl flex items-center gap-1 cursor-pointer">
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </div>
                  </div>

                  {/* Residents preview card */}
                  <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        Z
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-foreground">Zainab Bibi</div>
                        <div className="text-[9px] font-semibold text-muted-foreground">House 15-A • Resident</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-white border border-border flex items-center justify-center text-muted-foreground"><PhoneCall className="w-3 h-3" /></span>
                      <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center"><MessageSquare className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating trust badges around the mockup */}
              <div className="absolute -top-6 -left-6 bg-white border border-border/80 p-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-float-delayed">
                <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">Safe Workspace</div>
                  <div className="text-[9px] font-bold text-muted-foreground">No random spammers</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white border border-border/80 p-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-float">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center animate-pulse">
                  <span className="text-xs font-black">🇵🇰</span>
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">Made for Pakistan</div>
                  <div className="text-[9px] font-bold text-muted-foreground">Housing societies & local mohallas</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Preview System */}
      <section id="preview" className="py-24 bg-white border-y border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-wider mb-4">
              Explore the Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-headings text-foreground mb-4">
              See How Mohalla Works
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              We replace confusing WhatsApp groups and unverified forums with custom, high-utility modules tailored for your neighborhood.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 mb-10 max-w-2xl mx-auto">
            <button
              onClick={() => setActivePreviewTab('board')}
              className={`w-full md:flex-1 py-3.5 px-6 rounded-2xl border text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                activePreviewTab === 'board'
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10 scale-[1.02]'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Megaphone className="w-4.5 h-4.5" /> Society Notice Board
            </button>
            <button
              onClick={() => setActivePreviewTab('bazaar')}
              className={`w-full md:flex-1 py-3.5 px-6 rounded-2xl border text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                activePreviewTab === 'bazaar'
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/10 scale-[1.02]'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" /> Mohalla Bazaar
            </button>
            <button
              onClick={() => setActivePreviewTab('directory')}
              className={`w-full md:flex-1 py-3.5 px-6 rounded-2xl border text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                activePreviewTab === 'directory'
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10 scale-[1.02]'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Neighbors Directory
            </button>
          </div>

          {/* Tab Screen Previews */}
          <div className="max-w-4xl mx-auto bg-background rounded-3xl border border-border p-4 sm:p-8 shadow-inner relative">
            <div className="absolute top-3 left-4 flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-6 mt-4 min-h-[300px] flex flex-col justify-between transition-all duration-300">
              
              {/* TAB 1: NOTICE BOARD */}
              {activePreviewTab === 'board' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-black text-foreground">📢 Society Notice Board</h4>
                      <p className="text-xs text-muted-foreground">Broadcast official notices, circulars, and community updates instantly.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">Official Channel</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Notice 1 */}
                    <div className="p-5 rounded-2xl bg-accent/40 border border-primary/10 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <Bell className="w-3.5 h-3.5" />
                          <span>IMPORTANT NOTICE</span>
                        </div>
                        <h5 className="font-headings font-black text-sm text-foreground">Water Tube Well Maintenance</h5>
                        <p className="text-xs text-muted-foreground/95 leading-relaxed">
                          Water supply will be suspended in Sectors B & C on Friday from 9 AM to 1 PM due to electrical motor repair. Please store water in advance.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-4 pt-2 border-t border-border/40 flex justify-between">
                        <span>Posted by: Admin (Bilal Khan)</span>
                        <span>Today</span>
                      </div>
                    </div>

                    {/* Notice 2 */}
                    <div className="p-5 rounded-2xl bg-muted/20 border border-border flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span>COMMUNITY NEWS</span>
                        </div>
                        <h5 className="font-headings font-black text-sm text-foreground">Independence Day Flag Hoisting</h5>
                        <p className="text-xs text-muted-foreground/95 leading-relaxed">
                          Join us at the Central Park for flag hoisting ceremony at 8:00 AM on August 14th. Sweets will be distributed for children.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-4 pt-2 border-t border-border/40 flex justify-between">
                        <span>Posted by: Society Manager</span>
                        <span>2 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOHALLA BAZAAR */}
              {activePreviewTab === 'bazaar' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-black text-foreground">🛍️ Mohalla Bazaar</h4>
                      <p className="text-xs text-muted-foreground">Buy, sell, or rent household items directly from neighbor to neighbor safely.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-accent tracking-wider bg-accent/10 px-2.5 py-1 rounded-full">Peer-to-Peer</span>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Item 1 */}
                    <div className="p-4 rounded-2xl border border-border bg-white hover:border-accent/20 transition-all flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">For Sale</span>
                        <h5 className="font-headings font-black text-sm text-foreground mt-2">HP Deskjet Printer (Unused)</h5>
                        <div className="text-base font-black text-accent mt-1">Rs. 8,500</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Excellent working condition. Includes dual color cartridges.</p>
                      </div>
                      <div className="border-t border-border/60 pt-3 mt-4 flex items-center justify-between">
                        <div className="text-[10px]">
                          <span className="font-bold text-foreground block">Zainab Bibi</span>
                          <span className="text-muted-foreground text-[9px]">House 15-A</span>
                        </div>
                        <a href="https://wa.me/923217654321" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 rounded-2xl border border-border bg-white hover:border-accent/20 transition-all flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Free / Giveaway</span>
                        <h5 className="font-headings font-black text-sm text-foreground mt-2">Class 9 Physics Textbooks</h5>
                        <div className="text-base font-black text-primary mt-1">Free</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Punjab Board curriculum, neat condition. Take away for free.</p>
                      </div>
                      <div className="border-t border-border/60 pt-3 mt-4 flex items-center justify-between">
                        <div className="text-[10px]">
                          <span className="font-bold text-foreground block">Bilal Ahmed</span>
                          <span className="text-muted-foreground text-[9px]">House 42-B</span>
                        </div>
                        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 rounded-2xl border border-border bg-white hover:border-accent/20 transition-all flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">For Rent</span>
                        <h5 className="font-headings font-black text-sm text-foreground mt-2">Electric Lawn Mower</h5>
                        <div className="text-base font-black text-accent mt-1">Rs. 500 / day</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Available for weekend lawn mowing. Heavy duty, includes cord.</p>
                      </div>
                      <div className="border-t border-border/60 pt-3 mt-4 flex items-center justify-between">
                        <div className="text-[10px]">
                          <span className="font-bold text-foreground block">Kamran Shah</span>
                          <span className="text-muted-foreground text-[9px]">Apartment 303</span>
                        </div>
                        <a href="https://wa.me/923129876543" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RESIDENTS DIRECTORY */}
              {activePreviewTab === 'directory' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-black text-foreground">👥 Residents Directory</h4>
                      <p className="text-xs text-muted-foreground">Quickly view unit numbers, verification status, and contact your real neighbors.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">Verified Residents</span>
                  </div>

                  <div className="divide-y divide-border/60">
                    {/* Member 1 */}
                    <div className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                          F
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                            <span>Farooq Ahmed</span>
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase">Admin</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Unit: House 42-B | 0300-1234567</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href="tel:03001234567" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          <PhoneCall className="w-4 h-4" />
                        </a>
                        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Member 2 */}
                    <div className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-base">
                          Z
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                            <span>Zainab Bibi</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">Verified</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Unit: House 15-A | 0321-7654321</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href="tel:03217654321" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          <PhoneCall className="w-4 h-4" />
                        </a>
                        <a href="https://wa.me/923217654321" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Member 3 */}
                    <div className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                          K
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                            <span>Kamran Shah</span>
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100">Moderator</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Unit: Apartment 303 | 0312-9876543</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href="tel:03129876543" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          <PhoneCall className="w-4 h-4" />
                        </a>
                        <a href="https://wa.me/923129876543" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 3. Safety & Verification Section */}
      <section id="safety" className="py-24 bg-gradient-to-b from-white via-accent/30 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-4">
              Security First
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-headings text-foreground mb-4">
              How We Keep Mohalla Safe & Secure
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              We protect your privacy. Only real, approved neighbors can view your posts and profiles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all-300 relative group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xl glow-secondary">
                  <UserPlus className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-headings text-foreground">1. Resident Sign-Up</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Residents register by choosing their specific housing society and entering their exact unit/house number, phone, and name.
                </p>
              </div>
              <div className="text-xs font-bold text-accent mt-6 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Unique registration</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all-300 relative group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl glow-primary">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-headings text-foreground">2. Admin Verification</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  New users are put in a restricted &apos;pending&apos; status. The registered society Administrator reviews and verifies their resident details.
                </p>
              </div>
              <div className="text-xs font-bold text-primary mt-6 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Zero random profiles</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all-300 relative group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xl glow-secondary">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-headings text-foreground">3. Access Granted</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once verified, the resident gains access to the Notice Board, Listings, and Directory. Contact details are hidden from search engines.
                </p>
              </div>
              <div className="text-xs font-bold text-accent mt-6 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Fully connected neighborhood</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Active Cities & Stats Section */}
      <section className="py-24 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-4 animate-float">
                Covering Pakistan
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-headings text-foreground leading-[1.15]">
                Connecting Mohallas Across Major Cities
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-4 leading-relaxed">
                Whether you live in a housing society block in Lahore, a gated community in Karachi, or a sector apartment in Islamabad, Mohalla brings your real neighbors closer.
              </p>
            </div>
            
            {/* Stats list */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-accent/30 rounded-3xl border border-primary/10">
                <div className="text-3xl font-black text-primary">3</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">Cities covered</div>
              </div>
              <div className="p-6 bg-sky-50/30 rounded-3xl border border-accent/10">
                <div className="text-3xl font-black text-accent">5,000+</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">Residents registered</div>
              </div>
              <div className="p-6 bg-sky-50/30 rounded-3xl border border-accent/10">
                <div className="text-3xl font-black text-accent">150+</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">Active societies</div>
              </div>
              <div className="p-6 bg-accent/30 rounded-3xl border border-primary/10">
                <div className="text-3xl font-black text-primary">99.8%</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">Verification accuracy</div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {/* Karachi */}
            <div className="relative group overflow-hidden rounded-3xl border border-border h-72 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent z-10" />
              {/* Fallback styling for visual map card */}
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center -z-10 group-hover:scale-105 transition-transform duration-500">
                <span className="text-4xl">🏙️</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-white/90">Sindh</span>
                </div>
                <h4 className="text-2xl font-black font-headings">Karachi</h4>
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1 leading-relaxed">
                  <Building className="w-3.5 h-3.5" /> Clifton, DHA, Gulshan, Askari, Malir Cantt
                </p>
              </div>
            </div>

            {/* Lahore */}
            <div className="relative group overflow-hidden rounded-3xl border border-border h-72 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent z-10" />
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center -z-10 group-hover:scale-105 transition-transform duration-500">
                <span className="text-4xl">🏡</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-white/95">Punjab</span>
                </div>
                <h4 className="text-2xl font-black font-headings">Lahore</h4>
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1 leading-relaxed">
                  <Building className="w-3.5 h-3.5" /> Johar Town, Bahria, Gulberg, Askari, DHA
                </p>
              </div>
            </div>

            {/* Islamabad */}
            <div className="relative group overflow-hidden rounded-3xl border border-border h-72 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent z-10" />
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center -z-10 group-hover:scale-105 transition-transform duration-500">
                <span className="text-4xl">🌳</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-white/95">Federal</span>
                </div>
                <h4 className="text-2xl font-black font-headings">Islamabad</h4>
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1 leading-relaxed">
                  <Building className="w-3.5 h-3.5" /> G-11, F-10, E-11, Bahria, DHA, Soan Garden
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FAQ Accordion Section */}
      <section id="faq" className="py-24 bg-gradient-to-b from-white to-accent/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-wider mb-4">
              Have Questions?
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-headings text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Learn how Mohalla transforms neighborhood utility and communication.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-6 font-headings font-bold text-foreground text-base sm:text-lg flex justify-between items-center hover:bg-muted/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      openFaqIndex === idx ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openFaqIndex === idx && (
                  <div className="p-6 pt-0 border-t border-border/40 text-sm sm:text-base text-muted-foreground leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. final CTA section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black font-headings">
            Ready to connect with your mohalla?
          </h2>
          <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Create a secure environment for your residents. Set up your society board, bazaar, and listings in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register?path=create" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-14 px-8 rounded-2xl bg-white text-primary border-white font-black hover:bg-emerald-50 hover:text-primary transition-all shadow-lg shadow-black/10">
                Create a new community
              </Button>
            </Link>
            <Link href="/register?path=join" className="w-full sm:w-auto">
              <Button variant="default" className="w-full h-14 px-8 rounded-2xl bg-primary-hover border border-white/20 text-white font-black hover:bg-white hover:text-primary transition-all">
                Search and join community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-foreground text-muted py-12 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-base">
              M
            </div>
            <span className="font-headings text-xl font-bold tracking-tight text-white">
              Mohalla App Pakistan
            </span>
          </div>
          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} Mohalla. All rights reserved. Connecting neighborhoods securely.
          </p>
        </div>
      </footer>

    </div>
  );
}
