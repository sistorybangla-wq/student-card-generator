"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { CardType, CardTemplate } from "@/types/card";
import { cardConfig } from "@/config/cardTemplates";

interface CardSelectorProps {
  selectedCardType: CardType;
  onCardTypeChange: (cardType: CardType, template: CardTemplate) => void;
}

export const CardSelector = memo(({ selectedCardType, onCardTypeChange }: CardSelectorProps) => {
  const [hoveredCard, setHoveredCard] = useState<CardType | null>(null);

  const handleCardSelect = (cardType: CardType) => {
    const template = cardConfig.templates[cardType];
    onCardTypeChange(cardType, template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Card Type</CardTitle>
        <p className="text-sm text-gray-600">
          Choose the university card template you want to generate
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(cardConfig.templates).map((template) => (
            <div
              key={template.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${template.name} card template`}
              aria-pressed={selectedCardType === template.id}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedCardType === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : hoveredCard === template.id
                  ? 'border-gray-400'
                  : 'border-gray-200'
              }`}
              onMouseEnter={() => setHoveredCard(template.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardSelect(template.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardSelect(template.id);
                }
              }}
            >
              {/* Selection indicator */}
              {selectedCardType === template.id && (
                <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Demo image */}
              <div className="aspect-[8/5] bg-gray-100 flex items-center justify-center">
                <Image
                  src={template.demoImagePath}
                  alt={`${template.name} demo`}
                  width={400}
                  height={250}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback if demo image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="flex items-center justify-center h-full text-gray-500">
                        <div class="text-center">
                          <div class="text-2xl mb-2">🎓</div>
                          <div class="text-sm">${template.name}</div>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>

              {/* Card info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="text-xs text-gray-500">
                  University Code: {template.university.code || 'N/A'}
                </div>
                
                {/* Form fields preview */}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Required Fields:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.formFields
                      .filter(field => field.required && field.id !== 'photo')
                      .slice(0, 4) // Show only first 4 fields
                      .map((field) => (
                        <span
                          key={field.id}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {field.label}
                        </span>
                      ))}
                    {template.formFields.filter(field => field.required && field.id !== 'photo').length > 4 && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        +{template.formFields.filter(field => field.required && field.id !== 'photo').length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Select button overlay on hover */}
              {hoveredCard === template.id && selectedCardType !== template.id && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Button variant="secondary" size="sm">
                    Select This Template
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected card info */}
        {selectedCardType && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Selected: {cardConfig.templates[selectedCardType].name}
            </h4>
            <p className="text-sm text-blue-700">
              {cardConfig.templates[selectedCardType].description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CardSelector.displayName = 'CardSelector';
