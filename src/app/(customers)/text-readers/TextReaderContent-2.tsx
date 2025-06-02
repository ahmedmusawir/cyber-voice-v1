"use client";

import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import InputTextarea from "@/components/text-readers/InputTextarea";
import ProcessingBlock from "@/components/text-readers/ProcessBlock";
import VoiceSelector from "@/components/text-readers/VoiceSelector";
import Head from "next/head";
import { useState } from "react";

const TextReaderContent = () => {
  const [rawInputText, setRawInputText] = useState("");
  const [appState, setAppState] = useState<
    "IDLE" | "PROCESSING" | "PARTIAL_AUDIO_READY" | "FULL_AUDIO_READY"
  >("IDLE");
  const [showOriginalInput, setShowOriginalInput] = useState(false);
  // Dummy state for play buttons, to be refined
  const [isPart1Playable, setIsPart1Playable] = useState(false);
  const [isFullPlayable, setIsFullPlayable] = useState(false);

  const handleStartProcessing = (inputText: string) => {
    setRawInputText(inputText);
    setAppState("PROCESSING");
    setShowOriginalInput(false); // Start with input folded
    setIsPart1Playable(false); // Reset play buttons
    setIsFullPlayable(false);

    // Simulate processing for enabling play buttons
    setTimeout(() => {
      setIsPart1Playable(true);
      setAppState("PARTIAL_AUDIO_READY"); // Or keep as PROCESSING and use separate flags
    }, 3000); // Simulate part 1 ready
    setTimeout(() => {
      setIsFullPlayable(true);
      setAppState("FULL_AUDIO_READY"); // Or keep as PROCESSING
    }, 6000); // Simulate full audio ready
  };

  const toggleShowOriginalInput = () => {
    setShowOriginalInput((prev) => !prev);
  };

  // return (
  //   <>
  //     <Head>
  //       <title>Cyber Voice</title> {/* Changed title */}
  //       <meta name="description" content="Cyber Voice Text to Speech" />
  //     </Head>
  //     <Page className={""} FULL={false}>
  //       {/* This first Row with VoiceSelector seems to be a general settings area */}
  //       <Row className="py-10 bg-gray-100">
  //         <h3 className="mb-5 text-center">Welcome to Cyber Voice</h3>{" "}
  //         {/* Changed title */}
  //         <div className="flex flex-col md:flex-row gap-4">
  //           <div className="w-full md:w-1/2 p-4">
  //             {/* Left column content - placeholder */}
  //           </div>
  //           <div className="w-full md:w-1/2 p-4">
  //             <div className="mb-5">
  //               <VoiceSelector />
  //             </div>
  //           </div>
  //         </div>
  //         {/* Main Input Section - Conditionally Rendered */}
  //         {appState === "IDLE" && (
  //           <InputTextarea onProcess={handleStartProcessing} /> // Pass callback
  //         )}
  //         {/* Collapsed Input Button & Optional Original Text Display */}
  //         {(appState === "PROCESSING" ||
  //           appState === "PARTIAL_AUDIO_READY" ||
  //           appState === "FULL_AUDIO_READY") && (
  //           <Row className="py-2">
  //             {" "}
  //             {/* Adjust padding as needed */}
  //             {/* We'll create CollapsedInputButton component */}
  //             {/* <CollapsedInputButton onClick={toggleShowOriginalInput} isShowingOriginal={showOriginalInput} /> */}
  //             <button
  //               onClick={toggleShowOriginalInput}
  //               className="px-4 py-2 bg-blue-500 text-white rounded"
  //             >
  //               {showOriginalInput
  //                 ? "Hide Original Input"
  //                 : "Show Original Input"}
  //             </button>
  //             {showOriginalInput && (
  //               <div className="mt-2 p-4 border rounded bg-gray-50 prose max-w-none">
  //                 {/* Displaying rawInputText here, could be a read-only textarea or markdown render */}
  //                 <pre className="whitespace-pre-wrap">{rawInputText}</pre>
  //               </div>
  //             )}
  //           </Row>
  //         )}
  //       </Row>

  //       {/* Processing Block - Conditionally Rendered or state-driven */}
  //       {(appState === "PROCESSING" ||
  //         appState === "PARTIAL_AUDIO_READY" ||
  //         appState === "FULL_AUDIO_READY") && (
  //         <Row className="prose max-w-none">
  //           {" "}
  //           {/* Ensure prose allows full width for your layout */}
  //           <ProcessingBlock
  //             markdownToDisplay={rawInputText}
  //             isProcessing={appState === "PROCESSING"} // For spinner
  //             isPart1Playable={isPart1Playable}
  //             isFullPlayable={isFullPlayable}
  //             // Add onPlayPart1, onPlayFull callbacks later
  //           />
  //         </Row>
  //       )}
  //     </Page>
  //   </>
  // );

  return (
    <>
      {/* ... (Head and initial Row with VoiceSelector remain the same) ... */}
      <Page FULL={false}>
        {" "}
        {/* Removed className for brevity, add back if needed */}
        <Row className="py-10 bg-gray-100">
          {" "}
          {/* This row contains welcome, voice selector, and input */}
          <h3 className="mb-5 text-center">Welcome to Cyber Voice</h3>
          {/* ... (VoiceSelector and its layout div) ... */}
          {/* Main Input Section or Collapsed Button */}
          {appState === "IDLE" ? (
            <InputTextarea onProcess={handleStartProcessing} />
          ) : (
            <div className="py-2 px-4">
              {" "}
              {/* Added padding for the collapsed button area */}
              <button
                onClick={toggleShowOriginalInput}
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                {showOriginalInput
                  ? "Hide Original Input"
                  : "[ Your Input Text ]"}
              </button>
              {showOriginalInput && (
                <div className="mt-2 p-4 border rounded bg-gray-50 prose max-w-none">
                  <pre className="whitespace-pre-wrap">{rawInputText}</pre>
                </div>
              )}
            </div>
          )}
        </Row>
        {/* ProcessingBlock is now ALWAYS rendered but its internal content changes */}
        <Row className="prose max-w-none p-4">
          {" "}
          {/* Added p-4 for consistent padding */}
          <ProcessingBlock
            appState={appState}
            markdownToDisplay={rawInputText} // Send rawInputText even in IDLE for initial instructions if needed
            isPart1Playable={isPart1Playable}
            isFullPlayable={isFullPlayable}
            // Add onPlayPart1, onPlayFull callbacks later
          />
        </Row>
      </Page>
    </>
  );
};

export default TextReaderContent;
