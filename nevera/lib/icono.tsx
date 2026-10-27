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
        background: "#1C1917",
      }}
    >
      <div
        style={{
          width: 44 * u,
          height: 68 * u,
          background: "#FAFAF9",
          borderRadius: 8 * u,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 24 * u,
            borderBottom: `${3 * u}px solid #A16207`,
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
            background: "#A16207",
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
            background: "#A16207",
            borderRadius: 2 * u,
          }}
        />
      </div>
    </div>
  );
}
