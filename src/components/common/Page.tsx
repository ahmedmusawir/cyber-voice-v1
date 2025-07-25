import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  FULL: boolean;
  className?: string;
  customYMargin?: string;
}

function Page({ children, className, FULL, customYMargin }: Props) {
  return (
    <>
      {FULL && (
        <section
          className={`min-h-full min-w-full ${
            customYMargin ? customYMargin : "my-5"
          } ${className}`}
        >
          {children ? children : "This is a Page container. Must have children"}
        </section>
      )}
      {!FULL && (
        <section
          className={`min-h-full w-11/12 mx-auto  ${
            customYMargin ? customYMargin : "my-5"
          } ${className}`}
        >
          {children ? children : "This is a Page Container. Must have children"}
        </section>
      )}
      {/* LG: 1024+ IS SET TO 91% WIDTH (w-11/12) */}
      {/* XL: 1280+ IS SET TO 80% WIDTH (w-4/5) */}
    </>
  );
}

export default Page;
