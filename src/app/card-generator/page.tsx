"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Sparkles, FileText, Send } from 'lucide-react';
import { generateStudentData, generateFallbackDataWithAvatar } from '@/lib/gemini';
import { getCardTemplate } from '@/config/cardTemplates';
import { CardType } from '@/types/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { AIGenerationProgress, CardPreviewSkeleton } from '@/components/loading-states';

// Dynamic imports are handled in individual functions for better performance

// Types
interface University {
  name: string;
  shortName: string;
  logo: string;
}

// University data
const universities: University[] = [
  {
    name: "Indian Institute of Technology Bombay",
    shortName: "IITB",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Bombay_Logo.svg"
  },
  {
    name: "Indian Institute of Technology Delhi", 
    shortName: "IITD",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg"
  },
  {
    name: "Indian Institute of Science Bangalore",
    shortName: "IISc", 
    logo: "https://engageindia.ca/wp-content/uploads/2017/01/IISc-500x500.png"
  },
  {
    name: "Indian Institute of Technology Madras",
    shortName: "IITM",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/69/IIT_Madras_Logo.svg"
  },
  {
    name: "Indian Institute of Technology Kanpur",
    shortName: "IITK", 
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzlbzSORQuaiBM1uuqdVUtJh3WB0-YjbTMiA&s"
  },
  {
    name: "Indian Institute of Technology Kharagpur",
    shortName: "IITKgp",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/1c/IIT_Kharagpur_Logo.svg"
  },
  {
    name: "University of Delhi",
    shortName: "DU",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/University_of_delhi_logo.png"
  },
  {
    name: "Jawaharlal Nehru University", 
    shortName: "JNU",
    logo: "https://pbs.twimg.com/media/GAgQfbPbsAADBVf.jpg"
  },
  {
    name: "Indian Institute of Management Ahmedabad",
    shortName: "IIMA",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/IIM%2C_Ahmedabad_Logo.svg/1200px-IIM%2C_Ahmedabad_Logo.svg.png"
  },
  {
    name: "Banaras Hindu University",
    shortName: "BHU", 
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ca/Banaras_Hindu_University_Emblem_Seal_Transparent.png"
  }
];

// Departments
const departments = [
  "Computer Science", "Information Technology", "Electronics Engineering",
  "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", 
  "Biotechnology", "Physics", "Mathematics", "Chemistry", "Business Administration",
  "Economics", "Psychology", "English Literature", "History", "Political Science"
];

export default function CardGeneratorPage() {
  // Add CSS styles for shine effect
  const shineStyles = `
    @keyframes shine {
      0% {
        transform: translateX(-100%) translateY(-100%) rotate(30deg);
      }
      100% {
        transform: translateX(100%) translateY(100%) rotate(30deg);
      }
    }

    .shine-effect {
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(1.02);
      transition: all 0.3s ease;
    }

    .shine-overlay {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0.6) 52%,
        rgba(255, 255, 255, 0.3) 54%,
        transparent 70%
      );
      animation: shine 2s ease-in-out;
      pointer-events: none;
    }

    @keyframes sparkle {
      0%, 100% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .sparkle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: radial-gradient(circle, #fff 0%, #ffd700 50%, transparent 70%);
      border-radius: 50%;
      animation: sparkle 1.5s ease-in-out infinite;
    }

    .sparkle-1 {
      top: 20%;
      left: 15%;
      animation-delay: 0.2s;
    }

    .sparkle-2 {
      top: 60%;
      left: 80%;
      animation-delay: 0.5s;
    }

    .sparkle-3 {
      top: 30%;
      left: 70%;
      animation-delay: 0.8s;
    }

    .sparkle-4 {
      top: 80%;
      left: 25%;
      animation-delay: 1.1s;
    }

    .sparkle-5 {
      top: 45%;
      left: 50%;
      animation-delay: 1.4s;
    }

    .sparkle-6 {
      top: 15%;
      left: 30%;
      animation-delay: 0.3s;
    }

    .sparkle-7 {
      top: 25%;
      left: 85%;
      animation-delay: 0.7s;
    }

    .sparkle-8 {
      top: 10%;
      left: 60%;
      animation-delay: 1.0s;
    }
  `;

  // Inject styles
  if (typeof document !== 'undefined') {
    const styleElement = document.getElementById('shine-styles');
    if (!styleElement) {
      const style = document.createElement('style');
      style.id = 'shine-styles';
      style.textContent = shineStyles;
      document.head.appendChild(style);
    }
  }
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [showShineEffect, setShowShineEffect] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationType, setGenerationType] = useState<"ai" | "quick" | null>(null);

  // Card data state for React rendering
  const [cardData, setCardData] = useState({
    universityName: "Manipal Academy of Higher Education",
    studentName: "Jayson Jame",
    studentDob: "2003-10-10",
    studentCourse: "2025 - 2028",
    studentClass: "MIT-CS-BTech-2024",
    studentDepartment: "Information Technology",
    studentId: "MAHE2025.0370467829",
    validUntil: "30/12/2027",
    universityLogo: "https://i.pinimg.com/736x/64/07/67/6407676eb7f221b13cf517923d0c3652.jpg",
    studentPhoto: "https://channel.mediacdn.vn/prupload/879/2018/05/img20180503174618883.jpg",
    barcodeData: "Manipal Academy of Higher Education"
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const hasGeneratedRef = useRef(false); // Track if initial generation has happened

  // Utility functions
  const getRandomElement = (array: unknown[]) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateRandomDate = () => {
    const today = new Date();
    const minAge = 20;
    const maxAge = 25;
    
    const randomAge = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
    const birthYear = today.getFullYear() - randomAge;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    
    return `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
  };

  const generateStudentID = (universityShort: string) => {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
    return `${universityShort}${year}.${randomNumber}`;
  };

  const generateCourse = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear;
    const endYear = startYear + 4;
    return `${startYear} - ${endYear}`;
  };

  const generateClass = () => {
    const deptCodes = ["CS", "IT", "EE", "ME", "CE", "CHE", "BT"];
    const degrees = ["BTech", "MTech", "PhD", "BSc", "MSc"];
    const year = new Date().getFullYear();
    
    return `${getRandomElement(deptCodes)}-${getRandomElement(degrees)}-${year}`;
  };

  const generateValidUntil = () => {
    const today = new Date();
    const validDate = new Date(today.getFullYear() + 3, today.getMonth(), today.getDate());
    return validDate.toLocaleDateString('en-GB');
  };

  // Function to validate image URL
  const validateImageUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        resolve(url);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Set timeout for image loading
      setTimeout(() => {
        reject(new Error(`Image loading timeout: ${url}`));
      }, 5000);

      img.src = url;
    });
  };

  // Get random student photo with fallback
  const getRandomStudentPhoto = async () => {
    try {
      const response = await fetch('/api/load-faces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "type": "R",
          "age": "21-35",
          "race": "asian",
          "emotion": "none"
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.fc && data.fc.length > 0) {
          // Try to find a working image URL
          for (const imageUrl of data.fc) {
            try {
              // If it's a data URL (placeholder), use it directly
              if (imageUrl.startsWith('data:')) {
                return imageUrl;
              }

              // For external URLs, validate them
              await validateImageUrl(imageUrl);
              return imageUrl;
            } catch (error) {
              console.warn(`Image validation failed for ${imageUrl}:`, error);
              continue; // Try next image
            }
          }

          // If no valid external images found, use first placeholder
          const fallbackImage = data.fc.find((url: string) => url.startsWith('data:'));
          if (fallbackImage) {
            return fallbackImage;
          }
        }

        throw new Error('No valid images found');
      } else {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error getting student photo:', error);
      // Return a default placeholder image
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlN0dWRlbnQ8L3RleHQ+PC9zdmc+';
    }
  };

  // Create a mock card template for Gemini generation
  const createMockCardTemplate = (university: University) => {
    // Use existing template structure from config
    const baseTemplate = getCardTemplate(CardType.BABU_BANARASI_DAS);
    return {
      ...baseTemplate,
      university: {
        name: university.name,
        code: university.shortName
      }
    };
  };

  const generateStudentCard = async () => {
    setIsGenerating(true);
    setGenerationType("ai");
    setGenerationProgress(0);
    setGenerationStatus("Initializing generation...");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(10);
      setGenerationStatus("Selecting university...");

      // Select random university
      const university = getRandomElement(universities) as University;
      setGenerationProgress(20);
      setGenerationStatus("Creating template...");

      // Create mock template for Gemini
      const mockTemplate = createMockCardTemplate(university);
      setGenerationProgress(30);
      setGenerationStatus("Connecting to AI service...");

      // Generate consistent data using Gemini AI
      let studentData;
      let generationMethod = '';
      try {
        console.log('🤖 Generating student data with Gemini...');
        setGenerationProgress(50);
        setGenerationStatus("Generating student data with AI...");
        studentData = await generateStudentData(mockTemplate);
        generationMethod = 'AI';
        setGenerationProgress(70);
        setGenerationStatus("AI generation complete!");
      } catch (error) {
        console.warn('Gemini generation failed, using fallback:', error);
        setGenerationStatus("AI failed, using quick generation...");
        studentData = await generateFallbackDataWithAvatar(mockTemplate);
        generationMethod = 'fallback';
        setGenerationProgress(70);
        setGenerationStatus("Quick generation complete!");
      }

      setGenerationProgress(80);
      setGenerationStatus("Loading student photo...");

      // Get student photo
      const studentPhoto = await getRandomStudentPhoto();

      setGenerationProgress(90);
      setGenerationStatus("Finalizing card data...");

      // Generate additional data that Gemini might not provide
      const studentID = studentData.studentId || generateStudentID(university.shortName);
      const validUntil = studentData.validUntil || generateValidUntil();

      // Update card data state for React rendering
      const newCardData = {
        universityName: university.name,
        studentName: studentData.name || 'Student Name',
        studentDob: studentData.dateOfBirth || generateRandomDate(),
        studentCourse: studentData.course || generateCourse(),
        studentClass: studentData.class || generateClass(),
        studentDepartment: studentData.department || getRandomElement(departments) as string,
        studentId: studentID,
        validUntil: validUntil,
        universityLogo: university.logo,
        studentPhoto: studentPhoto,
        barcodeData: university.name
      };

      console.log('🔄 Updating card data state:', newCardData);
      setCardData(newCardData);
      
      // Barcode will be updated automatically via React state
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCardGenerated(true);

      // Trigger shine effect
      setShowShineEffect(true);
      setTimeout(() => setShowShineEffect(false), 2000); // Remove after 2 seconds

      // Lưu card data để gửi extension
      const extensionData = {
        university: university.name,
        studentName: studentData.name || 'Student Name',
        studentId: studentID,
        course: studentData.course || generateCourse(),
        class: studentData.class || generateClass(),
        department: studentData.department || getRandomElement(departments) as string,
        dob: studentData.dateOfBirth || generateRandomDate(),
        validUntil: validUntil
      };
      console.log('💾 Card data saved for extension:', extensionData);
      



      setGenerationProgress(100);
      setGenerationStatus("Card generation complete!");

      // Mark card as generated and save to session
      setCardGenerated(true);
      hasGeneratedRef.current = true;
      sessionStorage.setItem('cardGenerated', 'true');

      // Show appropriate success message based on generation method
      if (generationMethod === 'AI') {
        toast.success('🤖 Student card generated with AI!');
      } else {
        toast.success('📝 Student card generated with fallback data!');
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(`❌ Unable to generate student card. ${error}`);
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };



  const downloadCard = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);

    try {
      // Dynamic import html2canvas-pro
      const html2canvas = (await import('html2canvas-pro')).default;

      // Create a clean copy of the card for capture
      const originalCard = cardRef.current;
      const cardClone = originalCard.cloneNode(true) as HTMLElement;

      // Remove problematic elements and styles
      cardClone.querySelectorAll('.shine-overlay, .sparkle').forEach(el => el.remove());
      cardClone.style.transform = 'none';
      cardClone.style.boxShadow = 'none';
      cardClone.style.filter = 'none';

      // Temporarily add clone to DOM for capture
      cardClone.style.position = 'absolute';
      cardClone.style.left = '-9999px';
      cardClone.style.top = '0';
      document.body.appendChild(cardClone);

      const canvas = await html2canvas(cardClone, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scale: 2 // Higher resolution for better quality
      });

      // Remove clone
      document.body.removeChild(cardClone);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          link.download = `student-card-${timestamp}.png`;
          link.href = url;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(url);
          toast.success('💾 Card downloaded as PNG successfully!');
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Download error:', error);
      toast.error(`❌ Unable to download card. ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadCardAsPDF = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);

    try {
      // Dynamic imports
      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;

      // Create a clean copy of the card for capture
      const originalCard = cardRef.current;
      const cardClone = originalCard.cloneNode(true) as HTMLElement;

      // Remove problematic elements and styles
      cardClone.querySelectorAll('.shine-overlay, .sparkle').forEach(el => el.remove());
      cardClone.style.transform = 'none';
      cardClone.style.boxShadow = 'none';
      cardClone.style.filter = 'none';

      // Temporarily add clone to DOM for capture
      cardClone.style.position = 'absolute';
      cardClone.style.left = '-9999px';
      cardClone.style.top = '0';
      document.body.appendChild(cardClone);

      const canvas = await html2canvas(cardClone, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scale: 2 // Higher resolution for better PDF quality
      });

      // Remove clone
      document.body.removeChild(cardClone);

      const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality

      // Create PDF with proper student card dimensions
      const cardWidth = 100; // Student card width in mm (larger than credit card)
      const cardHeight = 63; // Student card height in mm (maintaining aspect ratio)

      // Calculate actual canvas dimensions to maintain aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      const cardAspectRatio = cardWidth / cardHeight;

      let finalWidth = cardWidth;
      let finalHeight = cardHeight;

      // Adjust dimensions to maintain aspect ratio
      if (canvasAspectRatio > cardAspectRatio) {
        finalHeight = cardWidth / canvasAspectRatio;
      } else {
        finalWidth = cardHeight * canvasAspectRatio;
      }

      const pdf = new jsPDF({
        orientation: finalWidth > finalHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [finalWidth, finalHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight, '', 'FAST');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      pdf.save(`student-card-${timestamp}.pdf`);

      toast.success('📄 Card downloaded as PDF successfully!');

    } catch (error) {
      console.error('PDF Download error:', error);
      toast.error(`❌ Unable to download PDF. ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Initialize card state on load (without auto-generation)
  useEffect(() => {
    // Check if there's existing card data
    const hasGenerated = sessionStorage.getItem('cardGenerated');

    if (hasGenerated) {
      console.log('Previous card data found, enabling buttons...');
      setCardGenerated(true);
      hasGeneratedRef.current = true;
    } else {
      console.log('No previous card data, waiting for user action...');
      setCardGenerated(false);
      hasGeneratedRef.current = false;
    }
  }, []);

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

  // Function để gửi data cho extension
  const sendToExtension = () => {
    if (typeof window === 'undefined') return;

    // Sử dụng cardData state thay vì DOM elements
    const { universityName, studentName, studentId, studentDob } = cardData;

    if (!universityName || !studentName) {
      toast.error('Vui lòng tạo card trước khi gửi đến extension');
      return;
    }
    
    // Tách tên thành firstName và lastName
    const nameParts = studentName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Tạo email từ tên và ID với domain mapping
    const emailPrefix = `${firstName.toLowerCase()}.${studentId.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
    const emailDomain = getEmailDomainFromUniversity(universityName);
    const email = `${emailPrefix}@${emailDomain}`;
    
    const studentInfo = {
      school: universityName,
      firstName: firstName,
      lastName: lastName,
      studentName: `${firstName} ${lastName}`.trim(),
      studentId: studentId,
      email: email,
      dateOfBirth: studentDob,
      dob: studentDob, // Keep for backward compatibility
      course: '',
      department: '',
      address: '',
      mobileNumber: '',
      fatherName: ''
    };
    
    console.log('🔍 Sending to extension:', studentInfo);
    
    // Gửi message cho extension
    window.postMessage({
      type: 'STUDENT_CARD_EXTRACT',
      studentInfo: studentInfo
    }, '*');
    

    toast.success('✅ Đã gửi thông tin đến extension!');
  };

  // Lắng nghe response từ extension
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center py-8 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            🤖 AI Card Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create professional student ID cards with AI-generated realistic data
          </p>
        </div>

        {/* Controls */}
        <Card className="p-6 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">🤖 AI Card Generator</h2>

          {/* Loading States */}
          {isGenerating && generationType === "ai" && (
            <div className="mb-6">
              <AIGenerationProgress
                progress={generationProgress}
                status={generationStatus}
              />
            </div>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={generateStudentCard}
              disabled={isGenerating}
              className="min-w-[180px]"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "🤖 Generate with AI"}
            </Button>
            <Button
              onClick={downloadCard}
              disabled={!cardGenerated || isDownloading}
              variant="outline"
              className="min-w-[180px]"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "💾 Download PNG"}
            </Button>
            <Button
              onClick={downloadCardAsPDF}
              disabled={!cardGenerated || isDownloading}
              variant="outline"
              className="min-w-[180px]"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "📄 Download PDF"}
            </Button>
            <Button
              onClick={sendToExtension}
              disabled={!cardGenerated}
              variant="outline"
              className="min-w-[180px] bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              📤 Send to Extension
            </Button>
          </div>
        </Card>

        {/* Student Card */}
        <div className="flex justify-center">
          {isGenerating && !cardGenerated ? (
            <div className="w-[650px]">
              <CardPreviewSkeleton />
            </div>
          ) : (
            <div
              ref={cardRef}
              className={`w-[650px] min-h-[400px] bg-white dark:bg-gray-100 border-none rounded-2xl shadow-2xl overflow-hidden font-sans relative transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 ${
                showShineEffect ? 'shine-effect' : ''
              }`}
            >
            {/* Shine overlay - covers entire card including header */}
            {showShineEffect && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-50">
                <div className="shine-overlay"></div>
                {/* Sparkle particles */}
                <div className="sparkle sparkle-1"></div>
                <div className="sparkle sparkle-2"></div>
                <div className="sparkle sparkle-3"></div>
                <div className="sparkle sparkle-4"></div>
                <div className="sparkle sparkle-5"></div>
                <div className="sparkle sparkle-6"></div>
                <div className="sparkle sparkle-7"></div>
                <div className="sparkle sparkle-8"></div>
              </div>
            )}
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 min-h-[90px] flex items-center gap-5 relative">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400"></div>
              <Image
                id="university-logo"
                className="w-[85px] h-[85px] object-contain bg-white rounded-xl p-1.5 shadow-lg flex-shrink-0"
                src={cardData.universityLogo}
                alt="University Logo"
                width={85}
                height={85}
                unoptimized
              />
              <div className="flex flex-col justify-center">
                <div id="university-name" className="text-2xl font-bold tracking-wide mb-1 text-shadow text-gray-800">
                  {cardData.universityName}
                </div>
                <div className="text-yellow-300 text-xl font-semibold">
                  STUDENT CARD
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-wrap p-6 gap-6">
              <Image
                id="student-photo"
                className="w-[200px] h-[250px] object-cover border-2 border-gray-300 rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105"
                src={cardData.studentPhoto}
                alt="Student Photo"
                width={120}
                height={145}
                unoptimized
              />
              <div className="flex-1 text-lg min-w-[250px]">
                {/* Student Name - Full width */}
                <div className="mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <span className="text-blue-700 font-semibold inline-block min-w-[120px]">👤 Name:</span>
                  <span id="student-name" className="font-bold text-xl text-gray-800">{cardData.studentName}</span>
                </div>

                {/* Two column layout for other info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="mb-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-blue-700 font-semibold block text-sm">📅 DOB:</span>
                    <span id="student-dob" className="font-medium text-gray-800">{cardData.studentDob}</span>
                  </div>
                  <div className="mb-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-blue-700 font-semibold block text-sm">📚 Course:</span>
                    <span id="student-course" className="font-medium text-gray-800">{cardData.studentCourse}</span>
                  </div>
                  <div className="mb-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-blue-700 font-semibold block text-sm">🎒 Class:</span>
                    <span id="student-class" className="font-medium text-gray-800">{cardData.studentClass}</span>
                  </div>
                  <div className="mb-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-blue-700 font-semibold block text-sm">🏛️ Department:</span>
                    <span id="student-department" className="font-medium text-gray-800">{cardData.studentDepartment}</span>
                  </div>
                </div>

                {/* Valid until - Full width */}
                <div className="mt-3 p-2 rounded-lg ">
                  <span className="text-gray-700 font-semibold inline-block min-w-[120px]">⏰ Valid until:</span>
                  <span id="valid-until" className="font-bold text-gray-800">{cardData.validUntil}</span>
                </div>
              </div>
            </div>

            {/* Barcode */}
            <div className="flex justify-center px-6 mt-4 mb-3">
              <Image
                id="barcode"
                className="w-[90%] h-12 rounded shadow-sm border border-gray-200"
                src={`/api/barcode?data=${encodeURIComponent(cardData.barcodeData)}&code=Code128`}
                alt="Barcode"
                width={540}
                height={50}
                unoptimized
              />
            </div>

            {/* Bottom Info */}
            <div className="flex justify-between items-center px-6 pb-4">
              <div className="text-sm text-gray-700 bg-white px-4 py-2 rounded-lg font-semibold shadow-sm border border-gray-200">
                <span id="student-id">🆔 Student ID: {cardData.studentId}</span>
              </div>
              <div className="text-sm text-gray-700 bg-white px-4 py-2 rounded-lg font-semibold shadow-sm border border-gray-200">
                🇮🇳 India
              </div>
            </div>
          </div>
          )}
        </div>


      </div>
    </div>
  );
}
