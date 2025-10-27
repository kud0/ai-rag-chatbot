'use client';

import { Bot, Sparkles, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Bot,
    title: 'Intelligent Conversations',
    description: 'Advanced AI models that understand context and provide natural, human-like responses.',
  },
  {
    icon: Sparkles,
    title: 'Smart Learning',
    description: 'Continuously improving AI that learns from interactions to provide better answers.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with end-to-end encryption for all conversations.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Real-time responses powered by cutting-edge AI infrastructure.',
  },
];

export function FeaturesGrid() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Card key={index} className="border-2">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
