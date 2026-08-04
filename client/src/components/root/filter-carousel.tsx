import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { categories } from "@/constants";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const FilterCarousel = ({ value, setValue }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  return (
    <div className="relative w-full">
      <div
        className={cn(
          "absolute left-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none",
          current === 1 && "hidden"
        )}
      />
      <Carousel
        className="w-full px-12"
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: true,
        }}
      >
        <CarouselContent className="-ml-3">
          <CarouselItem
            className="pl-3 basis-auto"
            onClick={() => setValue("All")}
          >
            <Badge
              variant={value == "All" ? "default" : "secondary"}
              className="text-sm whitespace-nowrap cursor-pointer px-3 py-1"
            >
              All
            </Badge>
          </CarouselItem>
          {categories.map((category) => (
            <CarouselItem
              key={category}
              className="pl-3 basis-auto"
              onClick={() => setValue(category)}
            >
              <Badge
                className="text-sm whitespace-nowrap cursor-pointer px-3 py-1"
                variant={value == category ? "default" : "secondary"}
              >
                {category}
              </Badge>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 z-20" />
        <CarouselNext className="right-2 z-20" />
      </Carousel>
      <div
        className={cn(
          "absolute right-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-l dark:from-black from-white to-transparent  pointer-events-none",
          current === count && "hidden"
        )}
      />
    </div>
  );
};
