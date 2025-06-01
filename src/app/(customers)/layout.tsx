"use client";

import { ReactNode } from "react";
import Navbar from "@/components/global/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ReaderSidebar from "@/components/text-readers/ReaderSidebar";

interface LayoutProps {
  children: ReactNode;
}

const MemberLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Navbar /> */}
      <section className="flex flex-1">
        <div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
          <ReaderSidebar />
        </div>
        <div className="flex-grow">{children}</div>
      </section>
    </div>
  );
};

export default MemberLayout;
