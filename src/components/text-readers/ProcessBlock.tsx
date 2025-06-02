import VoiceSelector from "./VoiceSelector";
import { Button } from "@/components/ui/button";

const ProcessingBlock = () => {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      {/* <div className="px-4 py-5 sm:px-6"> */}
      <div className="px-4 py-0 sm:px-6">
        {/* Content goes here */}
        {/* We use less vertical padding on card headers on desktop than on body sections */}
      </div>
      <div className="px-4 py-5 sm:p-6">
        <h4 className="text-center">Audio Processing</h4>
        <p>
          Please paste your text above and hit the 'Start Processing' button.
          Once processing is complete, your audio controls will appear on the
          left
        </p>
      </div>
      <div className="px-4 py-4 sm:px-6">
        {/* Content goes here */}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
        <Button className="mr-2">Play Part 1</Button>
        <Button className="mr-2" variant="secondary">
          Play Part 2
        </Button>
        <Button variant="secondary">Play Part Full</Button>
      </div>
    </div>
  );
};

export default ProcessingBlock;
