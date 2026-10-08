export function Nevera({ lado }: { lado: number }) {
  const u = lado / 100;
  return (
    <div
      style={{
        width: lado,
        height: lado,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1F4D3A",
      }}
    >
      <div
        style={{
          width: 44 * u,
          height: 68 * u,
          background: "#FBF7F0",
          borderRadius: 8 * u,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 24 * u,
            borderBottom: `${3 * u}px solid #1F4D3A`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 9 * u,
            right: 6 * u,
            width: 3 * u,
            height: 9 * u,
            background: "#1F4D3A",
            borderRadius: 2 * u,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30 * u,
            right: 6 * u,
            width: 3 * u,
            height: 16 * u,
            background: "#1F4D3A",
            borderRadius: 2 * u,
          }}
        />
      </div>
    </div>
  );
}
