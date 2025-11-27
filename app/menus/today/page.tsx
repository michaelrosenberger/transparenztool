"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Meal {
  id: string;
  name: string;
  description: string;
  vegetables: Array<{
    vegetable: string;
    farmer_name: string;
  }>;
}

interface Menu {
  id: string;
  menu_date: string;
  title: string;
  subtitle: string | null;
  meal_ids: string[];
}

export default function TodayMenuPage() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    loadTodayMenu();
  }, []);

  const loadTodayMenu = async () => {
    try {
      const response = await fetch('/api/menus/today');
      
      if (!response.ok) {
        console.error("Error loading today menu:", response.statusText);
        setLoading(false);
        return;
      }

      const { menu: menuData, meals: mealsData } = await response.json();

      setMenu(menuData);
      setMeals(mealsData || []);
    } catch (error) {
      console.error("Error loading today menu:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!menu) {
    return (
      <>
        <Container dark fullWidth>
          <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div>
              <h1>Tagesmenü</h1>
            </div>
          </div>
        </Container>

        <Container asPage>
          <Card>
            <p className="text-center py-8 text-muted-foreground">
              Derzeit ist kein Tagesmenü verfügbar.
            </p>
          </Card>
        </Container>
      </>
    );
  }

  const formattedDate = new Date(menu.menu_date).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>{menu.title} {formattedDate}</h1>
            {menu.subtitle && <p className="mt-2">{menu.subtitle}</p>}
          </div>
        </div>
      </Container>

      <Container asPage>
        {meals.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-muted-foreground">
              Keine Mahlzeiten in diesem Menü.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {meals.map((meal) => (
              <Link
                key={meal.id}
                href={`/meal/${meal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-medium">{meal.name}</h3>
                    <ExternalLink className="h-5 w-5 flex-shrink-0 ml-2" />
                  </div>
                  
                  {meal.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {meal.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {meal.vegetables?.slice(0, 4).map((veg, idx) => (
                      <Badge key={idx} variant="default" className="text-sm">
                        {veg.vegetable}
                      </Badge>
                    ))}
                    {meal.vegetables && meal.vegetables.length > 4 && (
                      <Badge variant="default" className="text-sm">
                        +{meal.vegetables.length - 4} mehr
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
