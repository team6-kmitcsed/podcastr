import { GeneratePodcastProps } from '@/types'
import React, { useState } from 'react'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Loader } from 'lucide-react'
import { useAction, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast"

import { useUploadFiles } from '@xixixao/uploadstuff/react';

const useGeneratePodcast = ({
  setAudio, voiceType, voicePrompt, setAudioStorageId
}: GeneratePodcastProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast()

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl)

  const getPodcastAudio = useAction(api.openai.generateAudioAction)

  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const generatePodcast = async () => {
    setIsGenerating(true);
    setAudio('');

    if(!voicePrompt) {
      toast({
        title: "Please provide a voiceType to generate a podcast",
      })
      return setIsGenerating(false);
    }

    try {
      const response = await getPodcastAudio({
        voice: voiceType,
        input: voicePrompt
      })

      const blob = new Blob([response], { type: 'audio/mpeg' });
      const fileName = `podcast-${uuidv4()}.mp3`;
      const file = new File([blob], fileName, { type: 'audio/mpeg' });

      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;

      setAudioStorageId(storageId);

      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);
      setIsGenerating(false);
      toast({
        title: "Podcast generated successfully",
      })
    } catch (error) {
      console.log('Error generating podcast', error)
      toast({
        title: "Error creating a podcast",
        variant: 'destructive',
      })
      setIsGenerating(false);
    }
    
  }

  return { isGenerating, generatePodcast }
}

const GeneratePodcast = (props: GeneratePodcastProps) => {
  const { isGenerating, generatePodcast } = useGeneratePodcast(props);

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        <Label className="text-16 font-bold text-white-1">
          Provide Podcast Transcript for voice conversion
        </Label>
        <Textarea
  className="input-class font-light focus-visible:ring-offset-orange-1"
  placeholder="Provide text to generate audio"
  rows={5}
  value={props.voicePrompt}
  onChange={(e) => {
    // Trim only leading spaces
    const withoutLeadingSpaces = e.target.value.replace(/^\s+/, '');
    // Allow letters, numbers, spaces, comma, question mark, exclamation mark, and period
    const filteredValue = withoutLeadingSpaces.replace(/[^a-zA-Z0-9\s,?!\.]/g, '');
    props.setVoicePrompt(filteredValue);
  }}
/>
      </div>
      <div className="mt-5 w-full max-w-[200px]">
      <Button type="button" className="text-16 bg-orange-1 py-4 font-bold text-white-1" onClick={generatePodcast}>
        {isGenerating ? (
          <>
            Generating
            <Loader size={20} className="animate-spin ml-2" />
          </>
        ) : (
          'Generate'
        )}
      </Button>
      </div>
      {props.audio && (
        <audio 
          controls
          src={props.audio}
          autoPlay
          className="mt-5"
          onLoadedMetadata={(e) => props.setAudioDuration(e.currentTarget.duration)}
        />
      )}
    </div>
  )
}

export default GeneratePodcast










// import { GeneratePodcastProps } from "@/types";
// import React, { useState } from "react";
// import { Label } from "./ui/label";
// import { Textarea } from "./ui/textarea";
// import { Button } from "./ui/button";
// import { Loader } from "lucide-react";
// import { useAction, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { v4 as uuidv4 } from "uuid";
// import { useToast } from "@/components/ui/use-toast";
// import { useUploadFiles } from "@xixixao/uploadstuff/react";

// // This is your custom hook to generate the podcast and upload the file
// const useGeneratePodcast = ({
//   setAudio,
//   voiceType,
//   voicePrompt,
//   setAudioStorageId,
// }: GeneratePodcastProps) => {
//   const [isGenerating, setIsGenerating] = useState(false);
//   const { toast } = useToast();

//   const generateUploadUrl = useMutation(api.files.generateUploadUrl);
//   const { startUpload } = useUploadFiles(generateUploadUrl);

//   const getAudioUrl = useMutation(api.podcasts.getUrl); // Mutation to get the audio URL after uploading

//   // Function to handle manual upload of files (same as before)
//   const handleManualUpload = async (file: File) => {
//     try {
//       const uploaded = await startUpload([file]);
//       const storageId = (uploaded[0].response as any).storageId;

//       setAudioStorageId(storageId);

//       const audioUrl = await getAudioUrl({ storageId });
//       setAudio(audioUrl!);
//       toast({
//         title: "Audio uploaded successfully",
//       });
//     } catch (error) {
//       console.log("Error uploading audio file", error);
//       toast({
//         title: "Error uploading audio file",
//         variant: "destructive",
//       });
//     }
//   };

//   // Function to generate the podcast based on the prompt
//   const generatePodcast = async () => {
//     setIsGenerating(true);
//     setAudio(""); // Reset audio URL before starting

//     if (!voicePrompt) {
//       toast({
//         title: "Please provide a voice prompt to generate a podcast",
//       });
//       return setIsGenerating(false);
//     }

//     try {
//       // Send POST request to Flask backend to generate audio
//       const response = await fetch("http://127.0.0.1:5000/generate-audio", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ text: voicePrompt }), // Sending prompt to Flask backend
//       });

//       if (!response.ok) {
//         throw new Error("Failed to generate audio from Flask backend");
//       }

//       // Convert the response to a Blob (audio file)
//       const blob = await response.blob();
//       const fileName = `podcast-${uuidv4()}.mp3`;
//       const file = new File([blob], fileName, { type: "audio/mpeg" });

//       // Upload the generated audio just like a manual file
//       await handleManualUpload(file);

//       setIsGenerating(false);
//     } catch (error) {
//       console.log("Error generating podcast", error);
//       toast({
//         title: "Error creating a podcast",
//         variant: "destructive",
//       });
//       setIsGenerating(false);
//     }
//   };

//   return { isGenerating, generatePodcast, handleManualUpload };
// };

// const GeneratePodcast = (props: GeneratePodcastProps) => {
//   const { isGenerating, generatePodcast, handleManualUpload } = useGeneratePodcast(props);

//   const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       handleManualUpload(file); // Handle manual file upload
//     }
//   };

//   return (
//     <div>
//       {/* Input for AI-generated podcasts */}
//       <div className="flex flex-col gap-2.5">
//         <Label className="text-16 font-bold text-white-1">
//           AI Prompt to generate Podcast 
//         </Label>
//         <Textarea
//           className="input-class font-light focus-visible:ring-offset-orange-1"
//           placeholder="How to make a paper plane?"
//           rows={5}
//           value={props.voicePrompt}
//           onChange={(e) => props.setVoicePrompt(e.target.value)} // Update voice prompt
//         />
//       </div>
//       <div className="mt-5 w-full max-w-[200px]">
//         <Button
//           type="submit"
//           className="text-16 bg-orange-1 py-4 font-bold text-white-1"
//           onClick={generatePodcast} // Trigger podcast generation
//         >
//           {isGenerating ? (
//             <>
//               Generating
//               <Loader size={20} className="animate-spin ml-2" />
//             </>
//           ) : (
//             "Generate"
//           )}
//         </Button>
//       </div>

//       {/* Manual file upload */}
//       <div className="mt-5">
//         <Label className="text-16 font-bold text-white-1">
//           Or Upload Your Own Audio
//         </Label>
//         <div className="relative mt-2">
//           {/* Hidden file input */}
//           <input
//             id="file-upload"
//             type="file"
//             accept="audio/*"
//             onChange={onFileChange} // Trigger manual upload
//             className="hidden"
//           />

//           {/* Styled label as a button */}
//           <label
//             htmlFor="file-upload"
//             className="inline-flex justify-center items-center text-14 bg-orange-1 py-4 px-4 font-bold text-white-1 cursor-pointer rounded-lg"
//           >
//             Upload Audio
//           </label>

//           {/* Text to indicate no file selected */}
//           {!props.audio && (
//             <p className="mt-2 text-white-1 text-14 font-light">
//               No audio selected
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Display the generated audio */}
//       {props.audio && (
//         <audio
//           controls
//           src={props.audio}
//           autoPlay
//           className="mt-5"
//           onLoadedMetadata={(e) =>
//             props.setAudioDuration(e.currentTarget.duration)
//           }
//         />
//       )}
//     </div>
//   );
// };

// export default GeneratePodcast;

// import { GeneratePodcastProps } from "@/types";
// import React, { useState } from "react";
// import { Label } from "./ui/label";
// import { Textarea } from "./ui/textarea";
// import { Button } from "./ui/button";
// import { Loader } from "lucide-react";
// import { useAction, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { v4 as uuidv4 } from "uuid";
// import { useToast } from "@/components/ui/use-toast";

// import { useUploadFiles } from "@xixixao/uploadstuff/react";

// const useGeneratePodcast = ({
//   setAudio,
//   voiceType,
//   voicePrompt,
//   setAudioStorageId,
// }: GeneratePodcastProps) => {
//   const [isGenerating, setIsGenerating] = useState(false);
//   const { toast } = useToast();

//   const generateUploadUrl = useMutation(api.files.generateUploadUrl);
//   const { startUpload } = useUploadFiles(generateUploadUrl);

//   const getPodcastAudio = useAction(api.openai.generateAudioAction);

//   const getAudioUrl = useMutation(api.podcasts.getUrl);

//   // New function for handling manual file upload
//   const handleManualUpload = async (file: File) => {
//     try {
//       const uploaded = await startUpload([file]);
//       const storageId = (uploaded[0].response as any).storageId;

//       setAudioStorageId(storageId);

//       const audioUrl = await getAudioUrl({ storageId });
//       setAudio(audioUrl!);
//       toast({
//         title: "Audio uploaded successfully",
//       });
//     } catch (error) {
//       console.log("Error uploading audio file", error);
//       toast({
//         title: "Error uploading audio file",
//         variant: "destructive",
//       });
//     }
//   };

//   const generatePodcast = async () => {
//     setIsGenerating(true);
//     setAudio("");

//     if (!voicePrompt) {
//       toast({
//         title: "Please provide a voiceType to generate a podcast",
//       });
//       return setIsGenerating(false);
//     }

//     try {
//       const response = await getPodcastAudio({
//         voice: voiceType,
//         input: voicePrompt,
//       });

//       const blob = new Blob([response], { type: "audio/mpeg" });
//       const fileName = `podcast-${uuidv4()}.mp3`;
//       const file = new File([blob], fileName, { type: "audio/mpeg" });

//       await handleManualUpload(file);
//       setIsGenerating(false);
//     } catch (error) {
//       console.log("Error generating podcast", error);
//       toast({
//         title: "Error creating a podcast",
//         variant: "destructive",
//       });
//       setIsGenerating(false);
//     }
//   };

//   return { isGenerating, generatePodcast, handleManualUpload };
// };

// const GeneratePodcast = (props: GeneratePodcastProps) => {
//   const { isGenerating, generatePodcast, handleManualUpload } =
//     useGeneratePodcast(props);

//   const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       handleManualUpload(file);
//     }
//   };

//   return (
//     <div>
//       {/* Input for AI-generated podcasts */}
//       <div className="flex flex-col gap-2.5">
//         <Label className="text-16 font-bold text-white-1">
//           AI Prompt to generate Podcast
//         </Label>
//         <Textarea
//           className="input-class font-light focus-visible:ring-offset-orange-1"
//           placeholder="Provide text to generate audio"
//           rows={5}
//           value={props.voicePrompt}
//           onChange={(e) => props.setVoicePrompt(e.target.value)}
//         />
//       </div>
//       <div className="mt-5 w-full max-w-[200px]">
//         <Button
//           type="submit"
//           className="text-16 bg-orange-1 py-4 font-bold text-white-1"
//           onClick={generatePodcast}
//         >
//           {isGenerating ? (
//             <>
//               Generating
//               <Loader size={20} className="animate-spin ml-2" />
//             </>
//           ) : (
//             "Generate"
//           )}
//         </Button>
//       </div>

//       {/* Manual file upload */}
//       <div className="mt-5">
//         <Label className="text-16 font-bold text-white-1">
//           Or Upload Your Own Audio
//         </Label>
//         <div className="relative mt-2">
//           {/* Hidden file input */}
//           <input
//             id="file-upload"
//             type="file"
//             accept="audio/*"
//             onChange={onFileChange}
//             className="hidden"
//           />

//           {/* Styled label as a button */}
//           <label
//             htmlFor="file-upload"
//             className="inline-flex justify-center items-center text-14 bg-orange-1 py-4 px-4 font-bold text-white-1 cursor-pointer rounded-lg"
//           >
//             Upload Audio
//           </label>

//           {/* Text to indicate no file selected */}
//           {!props.audio && (
//             <p className="mt-2 text-white-1 text-14 font-light">
//               No audio selected
//             </p>
//           )}
//         </div>
//       </div>

//       {props.audio && (
//         <audio
//           controls
//           src={props.audio}
//           autoPlay
//           className="mt-5"
//           onLoadedMetadata={(e) =>
//             props.setAudioDuration(e.currentTarget.duration)
//           }
//         />
//       )}
//     </div>
//   );
// };

// export default GeneratePodcast;










