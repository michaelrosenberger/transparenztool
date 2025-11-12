"use client";

import Container from "@/app/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function StyleGuidePage() {
  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Style Guide</h1>
            <p>A comprehensive overview of all typography, form elements, and button styles</p>
          </div>
        </div>
      </Container>

      <Container asPage>

      {/* Typography Section */}
      <Card className="mb-8">
        <h2 className="mb-6">Typography</h2>
        
        <div className="space-y-6">
          <div>
            <p className="mb-2 font-mono">h1 - 45px, font-weight: 400</p>
            <h1>Heading Level 1</h1>
          </div>

          <div>
            <p className="mb-2 font-mono">h2 - 30px, font-weight: 400</p>
            <h2>Heading Level 2</h2>
          </div>

          <div>
            <p className="mb-2 font-mono">h3 - 25px, font-weight: 500</p>
            <h3>Heading Level 3</h3>
          </div>

          <div>
            <p className="mb-2 font-mono">h4 - 20px, font-weight: 400</p>
            <h4>Heading Level 4</h4>
          </div>

          <div>
            <p className="mb-2 font-mono">h5 - 18px, font-weight: 700</p>
            <h5>Heading Level 5</h5>
          </div>

          <div>
            <p className="mb-2 font-mono">h6 - 18px, font-weight: 300</p>
            <h6>Heading Level 6</h6>
          </div>

          <div>
            <p className="mb-2 font-mono">body - 16px (forma-djr-micro)</p>
            <p>
              This is body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </Card>

      {/* Form Elements Section */}
      <Card className="mb-8">
        <h2 className="mb-6">Form Elements</h2>
        
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="sample-input">Sample Input Field</Label>
            <Input 
              id="sample-input" 
              type="text" 
              placeholder="Enter text here..."
            />
            <p className="text-xs">Helper text: 16px font size, font-weight: 400</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-input">Email Input</Label>
            <Input 
              id="email-input" 
              type="email" 
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-input">Password Input</Label>
            <Input 
              id="password-input" 
              type="password" 
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled Input</Label>
            <Input 
              id="disabled-input" 
              type="text" 
              placeholder="Disabled field"
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Buttons Section */}
      <Card className="mb-8">
        <h2 className="mb-6">Buttons</h2>
        
        <div className="space-y-8">
          {/* Default Variant */}
          <div>
            <h3 className="mb-4">Default Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>
              <Button size="default">Default Button</Button>
              <Button size="lg">Large Button</Button>
              <Button size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Button>
            </div>
          </div>

          {/* Outline Variant */}
          <div>
            <h3 className="mb-4">Outline Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm">Small Outline</Button>
              <Button variant="outline" size="default">Default Outline</Button>
              <Button variant="outline" size="lg">Large Outline</Button>
              <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Button>
            </div>
          </div>

          {/* Secondary Variant */}
          <div>
            <h3 className="mb-4">Secondary Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="sm">Small Secondary</Button>
              <Button variant="secondary" size="default">Default Secondary</Button>
              <Button variant="secondary" size="lg">Large Secondary</Button>
            </div>
          </div>

          {/* Ghost Variant */}
          <div>
            <h3 className="mb-4">Ghost Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" size="sm">Small Ghost</Button>
              <Button variant="ghost" size="default">Default Ghost</Button>
              <Button variant="ghost" size="lg">Large Ghost</Button>
            </div>
          </div>

          {/* Destructive Variant */}
          <div>
            <h3 className="mb-4">Destructive Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive" size="sm">Small Destructive</Button>
              <Button variant="destructive" size="default">Default Destructive</Button>
              <Button variant="destructive" size="lg">Large Destructive</Button>
            </div>
          </div>

          {/* Link Variant */}
          <div>
            <h3 className="mb-4">Link Variant</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="link" size="sm">Small Link</Button>
              <Button variant="link" size="default">Default Link</Button>
              <Button variant="link" size="lg">Large Link</Button>
            </div>
          </div>

          {/* Disabled State */}
          <div>
            <h3 className="mb-4">Disabled State</h3>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled Default</Button>
              <Button variant="outline" disabled>Disabled Outline</Button>
              <Button variant="secondary" disabled>Disabled Secondary</Button>
            </div>
          </div>

          {/* Buttons with Icons */}
          <div>
            <h3 className="mb-4">Buttons with Icons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
                With Icon
              </Button>
              <Button variant="outline">
                Button Text
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Colors Section */}
      <Card className="mb-8">
        <h2 className="mb-6">Colors</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-primary border"></div>
            <div>
              <p className="font-mono">--primary</p>
              <p>Primary color</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-secondary border"></div>
            <div>
              <p className="font-mono">--secondary</p>
              <p>Secondary color</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-grey-2 border"></div>
            <div>
              <p className="font-mono">--grey-2</p>
              <p>rgba(162, 162, 162, 1)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-destructive border"></div>
            <div>
              <p className="font-mono">--destructive</p>
              <p>Destructive/error color</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-background border border-foreground"></div>
            <div>
              <p className="font-mono">--background</p>
              <p>Background color</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-foreground border"></div>
            <div>
              <p className="font-mono">--foreground</p>
              <p>Foreground/text color</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Border Radius Section */}
      <Card className="mb-8">
        <h2 className="mb-6">Border Radius</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-sm bg-primary"></div>
            <div>
              <p className="font-mono">rounded-sm</p>
              <p>--radius-sm (calc(var(--radius) - 4px))</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-md bg-primary"></div>
            <div>
              <p className="font-mono">rounded-md</p>
              <p>--radius-md (calc(var(--radius) - 2px))</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-primary"></div>
            <div>
              <p className="font-mono">rounded-lg</p>
              <p>--radius-lg (var(--radius) = 0.625rem)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-primary"></div>
            <div>
              <p className="font-mono">rounded-xl</p>
              <p>--radius-xl (calc(var(--radius) * 3) ≈ 1.875rem)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Accordion Section */}
      <Card>
        <h2 className="mb-6">Accordion</h2>
        
        <div className="space-y-8">
          {/* Default Variant */}
          <div>
            <h3 className="mb-4">Default Variant</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Frage Nr 1</AccordionTrigger>
                <AccordionContent>
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, 
                  sed diam voluptua. At vero eos et accusam et justo duo dolores et ea 
                  rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem 
                  ipsum dolor sit amet.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Frage Nr 2</AccordionTrigger>
                <AccordionContent>
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Dark Variant */}
          <div>
            <h3 className="mb-4">Dark Variant (Rounded)</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dark-1" variant="dark">
                <AccordionTrigger variant="dark">Frage Nr 1</AccordionTrigger>
                <AccordionContent variant="dark">
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, 
                  sed diam voluptua. At vero eos et accusam et justo duo dolores et ea 
                  rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem 
                  ipsum dolor sit amet. Lorem ipsum dolor sit amet, consectetur sadipscing 
                  elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna 
                  aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo 
                  dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus 
                  est Lorem ipsum dolor sit amet.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dark-2" variant="dark">
                <AccordionTrigger variant="dark">Frage Nr 2</AccordionTrigger>
                <AccordionContent variant="dark">
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Light Variant */}
          <div>
            <h3 className="mb-4">Light Variant (Rounded)</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="light-1" variant="light">
                <AccordionTrigger variant="light">Frage Nr 1</AccordionTrigger>
                <AccordionContent variant="light">
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, 
                  sed diam voluptua. At vero eos et accusam et justo duo dolores et ea 
                  rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem 
                  ipsum dolor sit amet. Lorem ipsum dolor sit amet, consectetur sadipscing 
                  elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna 
                  aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo 
                  dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus 
                  est Lorem ipsum dolor sit amet.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="light-2" variant="light">
                <AccordionTrigger variant="light">Frage Nr 2</AccordionTrigger>
                <AccordionContent variant="light">
                  Lorem ipsum dolor sit amet, consectetur sadipscing elitr, sed diam 
                  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Card>
      </Container>
    </>
  );
}
