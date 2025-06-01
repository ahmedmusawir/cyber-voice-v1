import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import InputTextarea from "@/components/text-readers/InputTextarea";
import ProcessingBlock from "@/components/text-readers/ProcessBlock";
import VoiceSelector from "@/components/text-readers/VoiceSelector";
import Head from "next/head";
import React from "react";

const TextReaderContent = () => {
  return (
    <>
      <Head>
        <title>TextReaderContent</title>
        <meta name="description" content="This is the template page" />
      </Head>
      <Page className={""} FULL={false}>
        <Row className="py-10 bg-gray-100">
          <h3 className="mb-5 text-center">Welcome to Cyber Readers</h3>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2 p-4">
              {/* Left column content */}
            </div>
            <div className="w-full md:w-1/2 p-4">
              {/* Right column content */}
              <div className="mb-5">
                <VoiceSelector />
              </div>
            </div>
          </div>

          <InputTextarea />
        </Row>
        <Row className="prose">
          {/* <h4>This is the Processing Block Page</h4> */}
          <ProcessingBlock />
        </Row>
      </Page>
    </>
  );
};

export default TextReaderContent;
