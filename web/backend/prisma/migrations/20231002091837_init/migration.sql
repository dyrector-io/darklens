-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "address" TEXT,
    "connectedAt" DATETIME,
    "disconnectedAt" DATETIME
);

-- CreateTable
CREATE TABLE "NodeToken" (
    "nodeId" TEXT NOT NULL PRIMARY KEY,
    "nonce" TEXT NOT NULL,
    CONSTRAINT "NodeToken_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NodeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "data" TEXT,
    CONSTRAINT "NodeEvent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_name_key" ON "Node"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NodeToken_nodeId_key" ON "NodeToken"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
