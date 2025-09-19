"use client";
import { Upload, AlertCircle, FileText, X } from "lucide-react";
import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";

const FileUpload = ({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMeter, setProgressMeter] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      setError("Please upload only PDF files (max 10MB each)");
      return;
    }

    // Filter for PDF files and check size
    const validFiles = acceptedFiles.filter((file) => {
      if (file.type !== "application/pdf") {
        setError("Please upload only PDF files");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size must be less than 10MB");
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create PDF file objects with URLs for preview
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("file", file, file.name);
      });
      const r = await axios.post(
        "http://localhost:3000/api/ingest-pdf",
        formData,
        {
          onUploadProgress(e) {
            if (e.total) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setProgressMeter(progress);
            }
          },
          timeout: 1000 * 60 * 5, // 5 minutes
        }
      );
      console.log({ r });
      if (r.status === 200) {
        toast.success(r?.data?.text || "Pdf embedded successfully");
        setSelectedFiles([]);
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Card className="w-full">
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary font-medium">
              Drop your PDF files here...
            </p>
          ) : (
            <div>
              <p className="text-foreground font-medium mb-2">
                Drag & drop PDF files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports multiple files • Max 10MB per file
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={isProcessing || selectedFiles.length === 0}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <ClipLoader size={12} />
              <span>Processing</span>
              {progressMeter > 0 && <span>{progressMeter}%</span>}
            </>
          ) : (
            `Upload ${
              selectedFiles.length > 0
                ? `${selectedFiles.length} file ${
                    selectedFiles.length > 1 ? "s" : ""
                  }`
                : ``
            }`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export { FileUpload };
