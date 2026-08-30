"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Zap } from "lucide-react";
import { AIGenerationProgress, QuickGenerationLoader } from "@/components/loading-states";
import { StudentForm } from "./StudentForm";
import { CardPreview } from "./CardPreview";
import { CardSelector } from "./CardSelector";
import { generateStudentData } from "@/lib/gemini";
import { StudentData, CardType, CardTemplate } from "@/types/card";
import { cardConfig, getDefaultCardTemplate } from "@/config/cardTemplates";

export const StudentCardGenerator = () => {
  // Initialize with default card template
  const defaultTemplate = getDefaultCardTemplate();
  const [selectedCardType, setSelectedCardType] = useState<CardType>(cardConfig.defaultCardType);
  const [cardTemplate, setCardTemplate] = useState<CardTemplate>(defaultTemplate);

  // Initialize student data with empty values for all fields in the default template
  const initializeStudentData = (template: CardTemplate): StudentData => {
    const data: StudentData = {};
    template.formFields.forEach(field => {
      data[field.id] = field.id === 'photo' ? null : '';
    });
    return data;
  };

  const [studentData, setStudentData] = useState<StudentData>(
    initializeStudentData(defaultTemplate)
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationType, setGenerationType] = useState<"ai" | "quick" | null>(null);

  // Handle card type selection
  const handleCardTypeChange = (newCardType: CardType, newTemplate: CardTemplate) => {
    setSelectedCardType(newCardType);
    setCardTemplate(newTemplate);

    // Reset student data to match new template fields
    const newStudentData = initializeStudentData(newTemplate);
    setStudentData(newStudentData);

    // Reset generated state when switching templates
    setIsGenerated(false);

    toast.success(`Switched to ${newTemplate.name}`);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGenerationType("ai");
    setGenerationProgress(0);
    setGenerationStatus("Initializing AI generation...");

    try {
      console.log("Starting auto-generation...");

      // Simulate progress updates
      setGenerationProgress(20);
      setGenerationStatus("Connecting to AI service...");

      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(40);
      setGenerationStatus("Generating student data...");

      // Gọi generateStudentData trực tiếp - đã có timeout handling bên trong
      const generatedData = await generateStudentData(cardTemplate);
      console.log("Generated data:", generatedData);

      setGenerationProgress(80);
      setGenerationStatus("Finalizing data...");

      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerationProgress(100);
      setGenerationStatus("Complete!");

      setStudentData(prev => ({
        ...prev,
        ...generatedData
      }));
      setIsGenerated(true); // Mark as generated
      toast.success("Student data generated successfully!");
    } catch (error) {
      console.error("Error generating data:", error);

      // Immediate fallback
      try {
        const { generateFallbackData } = await import("@/lib/gemini");
        const fallbackData = generateFallbackData(cardTemplate);
        setStudentData(prev => ({
          ...prev,
          ...fallbackData
        }));
        setIsGenerated(true); // Mark as generated
        toast.warning("Used quick fallback data generation.");
      } catch (fallbackError) {
        console.error("Fallback generation failed:", fallbackError);
        toast.error("Failed to generate data. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };

  const handleQuickGenerate = async () => {
    setIsGenerating(true);
    setGenerationType("quick");

    try {
      console.log("Quick generating with fallback data...");

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const { generateFallbackDataWithAvatar } = await import("@/lib/gemini");
      const fallbackData = await generateFallbackDataWithAvatar(cardTemplate);

      setStudentData(prev => ({
        ...prev,
        ...fallbackData
      }));
      setIsGenerated(true); // Mark as generated
      toast.success("Quick data generated instantly!");
    } catch (error) {
      console.error("Quick generation failed:", error);
      toast.error("Failed to generate data. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Card Type Selection */}
      <CardSelector
        selectedCardType={selectedCardType}
        onCardTypeChange={handleCardTypeChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <p className="text-sm text-gray-600">
              Fill in the details for {cardTemplate.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <StudentForm
              studentData={studentData}
              cardTemplate={cardTemplate}
              setStudentData={setStudentData}
            />
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="flex-1"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "AI Generate"}
              </Button>
              
              <Button
                onClick={handleQuickGenerate}
                disabled={isGenerating}
                className="flex-1"
                variant="default"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Quick Generate"}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <span className="font-medium">AI Generate:</span> Smart data with AI (slower) •
              <span className="font-medium"> Quick Generate:</span> Instant random data (faster)
            </div>
          </div>

          {/* Loading States */}
          {isGenerating && generationType === "ai" && (
            <AIGenerationProgress
              progress={generationProgress}
              status={generationStatus}
            />
          )}

          {isGenerating && generationType === "quick" && (
            <QuickGenerationLoader />
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Card Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <CardPreview
            studentData={studentData}
            cardTemplate={cardTemplate}
            isGenerated={isGenerated}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
