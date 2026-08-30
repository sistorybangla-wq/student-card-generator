"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { StudentData, CardTemplate, TextPosition } from "@/types/card";
import { toast } from "sonner";
import { CardPreviewSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { Download, FileText, Send } from "lucide-react";

interface CardPreviewProps {
  studentData: StudentData;
  cardTemplate: CardTemplate;
  isGenerated?: boolean; // New prop to track if card has been generated
}

export const CardPreview = ({ studentData, cardTemplate, isGenerated = false }: CardPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load template image from API or demo image
  useEffect(() => {
    if (!isClient || !cardTemplate) return;

    const img = new Image();
    img.onload = () => {
      setTemplateImage(img);
      setTemplateLoaded(true);
    };
    img.onerror = () => {
      toast.error("Failed to load card template");
    };

    // Use demo image if not generated yet, otherwise use actual template
    if (isGenerated) {
      // Load actual template from secure API route
      img.src = `/api/template/${cardTemplate.id}`;
    } else {
      // Load demo image from secure API route
      img.src = `/api/demo/${cardTemplate.id}`;
    }
  }, [isClient, cardTemplate, isGenerated]);

  // Helper function to draw text with proper positioning and styling
  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    position: TextPosition
  ) => {
    ctx.save();

    // Set font properties
    const fontWeight = position.fontWeight || 'normal';
    const fontSize = position.fontSize || 20;
    const fontFamily = position.fontFamily || 'Arial';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Set text color
    ctx.fillStyle = position.color || '#000000';

    // Set text alignment
    ctx.textAlign = (position.textAlign || 'left') as CanvasTextAlign;

    // Handle text wrapping if maxWidth is specified
    if (position.maxWidth) {
      const words = text.split(' ');
      let line = '';
      let y = position.y;
      const lineHeight = fontSize * 1.2;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > position.maxWidth && i > 0) {
          ctx.fillText(line, position.x, y);
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, position.x, y);
    } else {
      ctx.fillText(text, position.x, position.y);
    }

    ctx.restore();
  };

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !templateImage || !cardTemplate) return;

    // Set canvas size to match template dimensions
    canvas.width = cardTemplate.dimensions.width;
    canvas.height = cardTemplate.dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw template background
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    // Only draw text and photo if card has been generated
    if (isGenerated) {
      // Draw text fields based on template configuration
      cardTemplate.formFields.forEach((field) => {
        if (field.id === 'photo') return; // Skip photo field

        const value = studentData[field.id];
        const position = cardTemplate.textPositions[field.id];

        if (value && position) {
          drawText(ctx, value, position);
        }
      });

      // Draw student photo if provided
      if (studentData.photo && cardTemplate.photoPosition) {
        try {
          const photoImg = new Image();
          photoImg.onload = () => {
            const { x, y, width, height, borderRadius } = cardTemplate.photoPosition;

            // Draw photo with optional rounded corners
            ctx.save();
            ctx.beginPath();

            if (borderRadius && typeof ctx.roundRect === 'function') {
              ctx.roundRect(x, y, width, height, borderRadius);
            } else {
              ctx.rect(x, y, width, height);
            }

            ctx.clip();
            ctx.drawImage(photoImg, x, y, width, height);
            ctx.restore();
          };
          photoImg.src = studentData.photo;
        } catch (error) {
          console.error("Error drawing photo:", error);
        }
      }
    }
  }, [studentData, templateImage, cardTemplate, isGenerated]);

  // Draw card when data changes
  useEffect(() => {
    if (isClient && templateLoaded && templateImage && canvasRef.current) {
      drawCard();
    }
  }, [studentData, templateLoaded, templateImage, isClient, drawCard]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas not ready for download");
      return;
    }

    try {
      // Create download link
      const link = document.createElement('a');
      link.download = `student-card-${studentData.name || 'unnamed'}.png`;
      link.href = canvas.toDataURL('image/png');

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Card downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download card");
      console.error("Download error:", error);
    }
  };

  const handleDownloadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas not ready for download");
      return;
    }

    setIsDownloading(true);

    try {
      // Dynamic import jsPDF
      const jsPDF = (await import('jspdf')).default;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.width / canvas.height;

      let imgWidth = pdfWidth - 20; // 10mm margin on each side
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`student-card-${studentData.name || 'unnamed'}.pdf`);

      toast.success("Card downloaded as PDF successfully!");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error("PDF download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function để tạo email domain từ tên trường (sync với Extension)
  const getEmailDomainFromUniversity = (universityName: string): string => {
    if (!universityName) return "student.edu.in";

    const domainMap: Record<string, string> = {
      "Indian Institute of Technology Bombay": "iitb.ac.in",
      "Indian Institute of Technology Delhi": "iitd.ac.in",
      "Indian Institute of Science Bangalore": "iisc.ac.in",
      "Indian Institute of Technology Madras": "iitm.ac.in",
      "Indian Institute of Technology Kanpur": "iitk.ac.in",
      "Indian Institute of Technology Kharagpur": "iitkgp.ac.in",
      "University of Delhi": "du.ac.in",
      "Jawaharlal Nehru University": "jnu.ac.in",
      "Indian Institute of Management Ahmedabad": "iima.ac.in",
      "Banaras Hindu University": "bhu.ac.in",
      "Manipal Academy of Higher Education": "manipal.edu",
      "Babu Banarasi Das University": "bbditm.edu.in",
    };

    // Check for exact match
    if (domainMap[universityName]) {
      return domainMap[universityName];
    }

    // Check for partial matches
    for (const [key, domain] of Object.entries(domainMap)) {
      if (universityName.includes(key) || key.includes(universityName)) {
        return domain;
      }
    }

    return "student.edu.in";
  };

  const handleSendToExtension = () => {
    if (typeof window === 'undefined') return;

    // Extract data from studentData
    const universityName = cardTemplate.university?.name || '';
    const studentName = studentData.name || '';
    const studentId = studentData.studentId || '';
    let studentDob = studentData.dateOfBirth || studentData.dob || '';

    // Generate random DOB if not available (18-25 years old)
    if (!studentDob) {
      const age = Math.floor(Math.random() * 8) + 18; // Random age between 18-25
      const birthYear = new Date().getFullYear() - age;
      const birthMonth = Math.floor(Math.random() * 12) + 1; // 1-12
      const birthDay = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid invalid dates
      studentDob = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
      console.log(`🎂 Generated random DOB for age ${age}: ${studentDob}`);
    }

    console.log('🔍 CardPreview - Extracting data for extension:', {
      universityName,
      studentName,
      studentId,
      studentDob,
      rawStudentData: studentData
    });

    if (!universityName || !studentName) {
      toast.error('Card data is incomplete');
      return;
    }

    // Create email with proper domain mapping
    const nameParts = studentName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const emailPrefix = `${firstName.toLowerCase()}.${studentId.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
    const emailDomain = getEmailDomainFromUniversity(universityName);
    const email = `${emailPrefix}@${emailDomain}`;

    // Format date to match Extension expectation (YYYY-MM-DD)
    let formattedDob = studentDob;
    if (studentDob && !studentDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const dobDate = new Date(studentDob);
        if (!isNaN(dobDate.getTime())) {
          formattedDob = dobDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.log('Date format error:', error);
      }
    }

    // Structure data to match Extension expectations
    const studentInfo = {
      school: universityName,
      firstName: firstName,
      lastName: lastName,
      studentName: studentName, // Keep for backward compatibility
      studentId: studentId,
      email: email,
      dateOfBirth: formattedDob,
      dob: studentDob, // Keep for backward compatibility
      course: studentData.course || '',
      department: studentData.department || '',
      address: studentData.address || '',
      mobileNumber: studentData.mobileNumber || '',
      fatherName: studentData.fatherName || ''
    };

    console.log('📤 Sending to extension:', studentInfo);

    // Send message to extension (sync với Extension format)
    window.postMessage({
      type: 'STUDENT_CARD_EXTRACT',
      studentInfo: studentInfo
    }, '*');

    toast.success('📤 Student information sent to extension!');
  };

  // Listen for extension response
  useEffect(() => {
    const handleExtensionResponse = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== 'INFO_EXTRACTED') return;

      if (event.data.success) {
        console.log('✅ Extension đã nhận thông tin thành công');
      } else {
        console.log('❌ Extension gặp lỗi');
      }
    };

    window.addEventListener('message', handleExtensionResponse);
    return () => window.removeEventListener('message', handleExtensionResponse);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!templateLoaded) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-w-full"
          style={{ maxHeight: '500px' }}
        />
      </div>
      
      {studentData.name && (
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="min-w-[140px]"
          >
            <Download className="h-4 w-4 mr-2" />
            💾 Download PNG
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            variant="outline"
            className="min-w-[140px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "📄 Download PDF"}
          </Button>
          <Button
            onClick={handleSendToExtension}
            variant="outline"
            className="min-w-[140px] bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
          >
            <Send className="h-4 w-4 mr-2" />
            📤 Send to Extension
          </Button>
        </div>
      )}
      
      {!templateLoaded && <CardPreviewSkeleton />}

      {templateLoaded && !Object.values(studentData).some(value => value && value !== '') && (
        <div className="text-center text-gray-500 py-8">
          <p>Fill in student information to see preview</p>
        </div>
      )}
    </div>
  );
};
