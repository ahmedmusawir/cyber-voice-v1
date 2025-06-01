import React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; // Standard import for shadcn/ui Command
import {
  Trash2, // Icon for delete
  FileEdit, // Icon for edit/rename
} from "lucide-react"; // Using lucide-react icons already in your project
import { Button } from "@/components/ui/button"; // Standard import for shadcn/ui Button

// Dummy JSON data for the session list, using text similar to your blue draft
const dummySessions = [
  { id: "s1", name: "Project updates and..." },
  { id: "s2", name: "Meeting agenda ov..." },
  { id: "s3", name: "Welcome to CyberVoi..." },
  { id: "s4", name: "Quick Brown Fox Ju..." },
  // Add more dummy sessions if you like
  { id: "s5", name: "My Next Great Idea - Draft 1" },
];

const ReaderSidebar = () => {
  return (
    // The Command component acts as the main container for the sidebar
    // bg-secondary is from your original, rounded-lg and border are common for shadcn cards/commands
    <Command className="bg-secondary rounded-lg border h-full flex flex-col">
      {/* Section for the "New Voice" button and the search input */}
      <div className="p-3">
        {" "}
        {/* Padding around the button and search input */}
        {/* 1. Top button: Text changed to "New Voice". w-full to make it span the padded width. mb-3 for spacing. */}
        <Button className="w-full mb-3">New Voice</Button>
        {/* 2. Top search box: Functionality remains. Placeholder text updated. */}
        <CommandInput placeholder="Search sessions..." />
      </div>

      {/* List of saved sessions */}
      {/* CommandList will contain the scrollable list of items.
          px-3 for horizontal padding inside the list area.
          flex-grow and overflow-y-auto allow the list to take available space and scroll.
       */}
      <CommandList className="px-3 pb-3 flex-grow overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* CommandGroup to logically group the session items */}
        <CommandGroup
          heading="Saved Sessions"
          className="text-xs text-muted-foreground"
        >
          {dummySessions.map((session) => (
            <CommandItem
              key={session.id}
              // The 'value' prop is used by CommandInput for filtering.
              // It's good practice to set it explicitly to the string you want to search by.
              value={session.name}
              className="flex justify-between items-center mb-1 cursor-pointer group bg-gray-200" // group class for icon hover effects
              onSelect={() => {
                // This function is triggered when a session item is clicked or selected via keyboard
                console.log("Selected session:", session.name);
                // Future: Here you would typically load the selected session's data
              }}
            >
              {/* Session name: flex-grow to take available space, truncate for long names */}
              <span className="flex-grow truncate pr-2 text-sm">
                {session.name}
              </span>

              {/* Container for edit and delete icons */}
              {/* Icons are initially slightly transparent and become fully opaque on item hover */}
              <div className="flex items-center space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <FileEdit
                  className="h-4 w-4 text-muted-foreground hover:text-primary" // Change color on individual icon hover
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the CommandItem's onSelect from firing
                    console.log("Edit session:", session.name);
                    // Future: Implement renaming/edit logic here
                  }}
                  aria-label={`Edit ${session.name}`}
                />
                <Trash2
                  className="h-4 w-4 text-muted-foreground hover:text-destructive" // Change color on individual icon hover
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the CommandItem's onSelect from firing
                    console.log("Delete session:", session.name);
                    // Future: Implement delete logic here
                  }}
                  aria-label={`Delete ${session.name}`}
                />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default ReaderSidebar;
