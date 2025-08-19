"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { SKILLS } from "../app/data/skills";
import TileCard from "./TileCard";

// Flatten SKILLS into simple list
const allSkills: { id: string; title: string }[] = [];

Object.keys(SKILLS as any).forEach((industry: string) => {
  Object.keys((SKILLS as any)[industry]).forEach((func: string) => {
    Object.keys((SKILLS as any)[industry][func]).forEach((role: string) => {
      (SKILLS as any)[industry][func][role].forEach((s: string, idx: number) => {
        allSkills.push({
          id: `${industry}-${func}-${role}-${idx}`,
          title: s
        });
      });
    });
  });
});

export default function SwipeDeck() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Swiper
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
      >
        {allSkills.map((skill) => (
          <SwiperSlide key={skill.id}>
            <TileCard skill={skill.title} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
