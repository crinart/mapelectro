"use client";

import React, { useCallback, useMemo, useState } from "react";
import { YMaps, Map, Placemark, Polyline } from "@pbe/react-yandex-maps";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<StatusType, string> = {
  working: "#23a55a",
  maintenance: "#f59e0b",
  accident: "#ef4444",
};

const nodeIcons: Record<NodeType, string> = {
  support: "/icons/support.svg",
  tp: "/icons/tp.svg",
  rp: "/icons/rp.svg",
};

type StatusType = "working" | "maintenance" | "accident";
type NodeType = "support" | "tp" | "rp";
type LineType = "lep" | "kl";

type Comment = { id: string; body: string; createdAt: string };

type Node = {
  id: string;
  name: string;
  nodeType: NodeType;
  status: StatusType;
  lat: number;
  lon: number;
  description?: string;
  comments: Comment[];
};

type Line = {
  id: string;
  name: string;
  lineType: LineType;
  status: StatusType;
  from: string;
  to: string;
};

const nodeSchema = z.object({
  name: z.string().min(1, "Введите название"),
  nodeType: z.enum(["support", "tp", "rp"]),
  status: z.enum(["working", "maintenance", "accident"]).default("working"),
  lat: z.number(),
  lon: z.number(),
  description: z.string().optional(),
});

type NodeForm = z.infer<typeof nodeSchema>;

const commentSchema = z.object({
  body: z.string().min(1),
});

export default function ElectroMapMVP() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [placing, setPlacing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lineType, setLineType] = useState<LineType>("lep");
  const [lineSelection, setLineSelection] = useState<string[]>([]);
  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [typeFilter, setTypeFilter] = useState<NodeType | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "">("");
  const [search, setSearch] = useState("");

  const filteredNodes = useMemo(
    () =>
      nodes.filter(
        (n) =>
          (!typeFilter || n.nodeType === typeFilter) &&
          (!statusFilter || n.status === statusFilter) &&
          n.name.toLowerCase().includes(search.toLowerCase())
      ),
    [nodes, typeFilter, statusFilter, search]
  );

  const { register, handleSubmit, reset } = useForm<NodeForm>({
    resolver: zodResolver(nodeSchema),
  });

  const onMapClick = useCallback(
    (e: any) => {
      if (!placing) return;
      const coords = e.get("coords");
      reset({
        name: "",
        nodeType: "support",
        status: "working",
        lat: coords[0],
        lon: coords[1],
        description: "",
      });
      setNodeFormOpen(true);
    },
    [placing, reset]
  );

  const submitNode = useCallback(
    (data: NodeForm) => {
      const newNode: Node = {
        id: crypto.randomUUID(),
        ...data,
        comments: [],
      };
      setNodes((prev) => [...prev, newNode]);
      setNodeFormOpen(false);
      setPlacing(false);
    },
    []
  );

  const openManualForm = () => {
    reset({
      name: "",
      nodeType: "support",
      status: "working",
      lat: 66.0833,
      lon: 76.6333,
      description: "",
    });
    setNodeFormOpen(true);
  };

  const handlePlacemarkClick = (node: Node) => {
    if (connecting) {
      setLineSelection((sel) => {
        const next = [...sel, node.id];
        if (next.length === 2) {
          const [from, to] = next;
          const newLine: Line = {
            id: crypto.randomUUID(),
            name: `Линия ${lines.length + 1}`,
            lineType,
            status: "working",
            from,
            to,
          };
          setLines((ls) => [...ls, newLine]);
          setLineSelection([]);
          setConnecting(false);
        }
        return next;
      });
      return;
    }
    setSelectedNode(node);
  };

  const updateNode = (id: string, data: Partial<Node>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)));
  };

  const deleteNode = (id: string) => {
    if (!confirm("Удалить узел?")) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setLines((prev) => prev.filter((l) => l.from !== id && l.to !== id));
    setSelectedNode(null);
  };

  const addComment = (nodeId: string, body: string) => {
    const comment: Comment = {
      id: crypto.randomUUID(),
      body,
      createdAt: new Date().toISOString(),
    };
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, comments: [...n.comments, comment] } : n
      )
    );
  };

  const exportJSON = () => {
    const data = JSON.stringify({ nodes, lines }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "electromap.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const obj = JSON.parse(text);
        setNodes(obj.nodes || []);
        setLines(obj.lines || []);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const NodeCard = selectedNode && (
    <Sheet open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{selectedNode.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span>Статус:</span>
            <select
              className="border rounded p-1"
              value={selectedNode.status}
              onChange={(e) => updateNode(selectedNode.id, { status: e.target.value as StatusType })}
            >
              <option value="working">Работает</option>
              <option value="maintenance">Требуется ремонт</option>
              <option value="accident">Авария</option>
            </select>
            <Badge
              variant={
                selectedNode.status === "working"
                  ? "success"
                  : selectedNode.status === "maintenance"
                  ? "warning"
                  : "destructive"
              }
            >
              {selectedNode.status}
            </Badge>
          </div>
          <div>
            <label className="block mb-1">Описание</label>
            <textarea
              className="w-full border rounded p-1"
              value={selectedNode.description || ""}
              onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
            />
          </div>
          <div>
            <h4 className="font-medium mb-1">Комментарии</h4>
            <ul className="space-y-1 mb-2 max-h-40 overflow-y-auto">
              {selectedNode.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="text-gray-500 mr-2">{new Date(c.createdAt).toLocaleString()}</span>
                  {c.body}
                </li>
              ))}
            </ul>
            <CommentForm
              onSubmit={(body) => addComment(selectedNode.id, body)}
            />
          </div>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => deleteNode(selectedNode.id)}
          >
            Удалить узел
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen w-full">
      <div className="p-2 space-x-2 flex flex-wrap items-center">
        <Button
          variant={placing ? "outline" : "default"}
          onClick={() => {
            setPlacing((p) => !p);
            setConnecting(false);
          }}
        >
          Расположить на карте
        </Button>
        <Button onClick={openManualForm}>+ Добавить вручную</Button>
        <Button
          variant={connecting ? "outline" : "default"}
          onClick={() => {
            setConnecting((c) => !c);
            setPlacing(false);
            setLineSelection([]);
          }}
        >
          Соединить узлы
        </Button>
        {connecting && (
          <select
            className="ml-2 border rounded p-1"
            value={lineType}
            onChange={(e) => setLineType(e.target.value as LineType)}
          >
            <option value="lep">ЛЭП</option>
            <option value="kl">КЛ</option>
          </select>
        )}
        <select
          className="ml-auto border rounded p-1"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NodeType | "")}
        >
          <option value="">Все типы</option>
          <option value="support">Опора ЛЭП</option>
          <option value="tp">ТП</option>
          <option value="rp">РП</option>
        </select>
        <select
          className="border rounded p-1"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusType | "")}
        >
          <option value="">Все статусы</option>
          <option value="working">Работает</option>
          <option value="maintenance">Требуется ремонт</option>
          <option value="accident">Авария</option>
        </select>
        <input
          className="border rounded p-1"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button className="ml-2" onClick={exportJSON}>
          Экспорт JSON
        </Button>
        <input
          type="file"
          accept="application/json"
          onChange={importJSON}
          className="border ml-2"
        />
      </div>
      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
        <Map
          defaultState={{ center: [66.0833, 76.6333], zoom: 11 }}
          width="100%"
          height="calc(100% - 56px)"
          onClick={onMapClick}
          modules={["control.ZoomControl", "geolocation"]}
          options={{ suppressMapOpenBlock: true }}
        >
          {filteredNodes.map((n) => (
            <Placemark
              key={n.id}
              geometry={[n.lat, n.lon]}
              options={{
                iconLayout: "default#image",
                iconImageHref: nodeIcons[n.nodeType],
                iconColor: statusColors[n.status],
                isMask: true,
              }}
              onClick={() => handlePlacemarkClick(n)}
            />
          ))}
          {lines.map((l) => {
            const from = nodes.find((n) => n.id === l.from);
            const to = nodes.find((n) => n.id === l.to);
            if (!from || !to) return null;
            return (
              <Polyline
                key={l.id}
                geometry={
                  [
                    [from.lat, from.lon],
                    [to.lat, to.lon],
                  ]
                }
                options={{ strokeColor: statusColors[l.status], strokeWidth: 3 }}
              />
            );
          })}
        </Map>
      </YMaps>
      {NodeCard}
      <Dialog open={nodeFormOpen} onOpenChange={setNodeFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить узел</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(submitNode)}
            className="space-y-2"
          >
            <div>
              <label className="block mb-1">Название</label>
              <input
                className="w-full border rounded p-1"
                {...register("name")}
              />
            </div>
            <div>
              <label className="block mb-1">Тип</label>
              <select className="w-full border rounded p-1" {...register("nodeType")}>
                <option value="support">Опора ЛЭП</option>
                <option value="tp">ТП</option>
                <option value="rp">РП</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Статус</label>
              <select className="w-full border rounded p-1" {...register("status")}>
                <option value="working">Работает</option>
                <option value="maintenance">Требуется ремонт</option>
                <option value="accident">Авария</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1">Широта</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border rounded p-1"
                  {...register("lat", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block mb-1">Долгота</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border rounded p-1"
                  {...register("lon", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1">Описание</label>
              <textarea className="w-full border rounded p-1" {...register("description")} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (body: string) => void }) {
  const { register, handleSubmit, reset } = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        onSubmit(data.body);
        reset();
      })}
      className="flex space-x-2"
    >
      <input className="flex-1 border rounded p-1" {...register("body")} />
      <Button type="submit" size="sm">
        Добавить
      </Button>
    </form>
  );
}
