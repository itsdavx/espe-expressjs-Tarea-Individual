/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeBlock` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_timeBlockId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropTable
DROP TABLE "Appointment";

-- DropTable
DROP TABLE "TimeBlock";

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "claseId" TEXT,
    "fechaSesion" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inscripcion_claseId_idx" ON "Inscripcion"("claseId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_userId_claseId_fechaSesion_key" ON "Inscripcion"("userId", "claseId", "fechaSesion");

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
