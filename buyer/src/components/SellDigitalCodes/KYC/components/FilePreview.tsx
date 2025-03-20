import { useState } from "react";
import Image from "next/image";

interface FilePreviewProps {
  files: File[] | null;
  fileType: string;
}

const FilePreview = ({ files, fileType }: FilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  if (!files || files.length === 0) {
    return <span className="text-gray-500">Not provided</span>;
  }
  // Check if a file is a PDF
  const isPDF = (fileName: string): boolean => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension === "pdf";
  };
  // Check if a file is an image
  const isImage = (fileName: string): boolean => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp"].includes(extension || "");
  };

  const handlePreview = (file: File) => {
    // Only open modal for image files
    if (isImage(file.name)) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreviewName(file.name);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Get appropriate icon based on file type
  const getFileIcon = (fileName: string) => {
    if (isImage(fileName)) {
      return "/images/icons/image-file.svg";
    } else {
      return "/images/icons/document-file.svg";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) =>
          isPDF(file.name) ? (
            // Display PDF as text
            <div
              key={index}
              className="flex items-center px-3 py-1 bg-red-50 border border-red-100 rounded-md"
              title={file.name}
            >
              <span className="text-sm text-red-500 font-medium">
                PDF:{" "}
                {file.name.length > 20
                  ? `${file.name.substring(0, 18)}...`
                  : file.name}
              </span>
            </div>
          ) : (
            // Display others as icons
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePreview(file)}
              title={file.name}
            >
              <div className="w-10 h-10 relative">
                <Image
                  src={getFileIcon(file.name)}
                  alt={`${fileType} file`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {file.name.length > 12
                  ? `${file.name.substring(0, 10)}...`
                  : file.name}
              </span>
            </div>
          )
        )}
      </div>

      {/* Modal for file preview - only for images */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closePreview}
        >
          {/* Floating Close Button */}
          <button
            onClick={closePreview}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999] bg-blue text-white px-6 py-2.5 rounded-full shadow-lg font-medium hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-blue transition-all duration-200"
            aria-label="Close preview"
          >
            Close
          </button>

          <div
            className="relative bg-white rounded-lg p-2 max-w-3xl max-h-[90vh] w-full mx-4 mt-[230px] border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="text-lg font-medium truncate max-w-[80%]">
                {previewName}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close preview"
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center">
              <Image
                src={previewUrl}
                alt={previewName}
                width={800}
                height={600}
                style={{
                  objectFit: "contain",
                  maxWidth: "100%",
                  maxHeight: "calc(90vh - 60px)",
                }}
                className="rounded"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
