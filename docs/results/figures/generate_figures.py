#!/usr/bin/env python3
import json
import os
import matplotlib.pyplot as plt
import numpy as np

OUTPUT_DIR = "docs/results/figures"
JSON_FILE = "docs/results/algorithm_benchmark_results.json"

plt.rcParams.update({
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.titlesize': 14,
    'font.family': 'sans-serif'
})

def main():
    if not os.path.exists(JSON_FILE):
        print(f"File {JSON_FILE} not found yet.")
        return

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Figure 1: Convergence Curves (Score vs. Time over 60s)
    plot_convergence_curves(data)
    
    # 2. Figure 2: Stability & Variance (CV% and StdDev)
    plot_stability_variance(data)
    
    # 3. Figure 3: Throughput Comparison (Iterations & Moves/sec)
    plot_throughput(data)
    
    # 4. Figure 4: Manual vs. Automated Optimization (S1-S6 Metrics)
    plot_manual_vs_optimized(data)

    print("-> Đã tạo thành công toàn bộ các biểu đồ khoa học tại: " + OUTPUT_DIR)

def plot_convergence_curves(data):
    scn01 = next((s for s in data["scenarios"] if s["scenario_id"] == "SCN-REAL-01"), None)
    if not scn01:
        return

    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
    
    time_pts = [1, 5, 15, 30, 60]
    time_keys = ["1000ms", "5000ms", "15000ms", "30000ms", "60000ms"]
    
    colors = {
        "HILL_CLIMBING": "#1f77b4",       # Blue
        "SIMULATED_ANNEALING": "#d62728", # Red
        "TABU_SEARCH": "#2ca02c"          # Green
    }
    markers = {
        "HILL_CLIMBING": "o",
        "SIMULATED_ANNEALING": "s",
        "TABU_SEARCH": "^"
    }
    labels = {
        "HILL_CLIMBING": "Hill Climbing (Local Search)",
        "SIMULATED_ANNEALING": "Simulated Annealing",
        "TABU_SEARCH": "Tabu Search"
    }

    for algo_key, algo_data in scn01["algorithms"].items():
        if algo_key not in colors:
            continue
        runs = algo_data["runs"]
        scores_by_time = []
        for tk in time_keys:
            vals = [r["convergence_trajectory"][tk]["soft"] for r in runs if tk in r["convergence_trajectory"]]
            scores_by_time.append(vals)
        
        means = [np.mean(v) for v in scores_by_time]
        stds = [np.std(v) for v in scores_by_time]
        
        ax.plot(time_pts, means, label=labels[algo_key], color=colors[algo_key],
                marker=markers[algo_key], linewidth=2.2, markersize=7)
        ax.fill_between(time_pts, [m - s for m, s in zip(means, stds)],
                        [m + s for m, s in zip(means, stds)], color=colors[algo_key], alpha=0.15)

    ax.set_title("Đường cong hội tụ theo thời gian: Kế hoạch mở lớp 236 buổi (Score vs. Time)", pad=12, fontweight='bold')
    ax.set_xlabel("Thời gian chạy (giây)")
    ax.set_ylabel("Điểm phạt mềm S (càng thấp càng tốt)")
    ax.set_xticks(time_pts)
    ax.set_xlim(0, 62)
    ax.grid(True, linestyle="--", alpha=0.6)
    ax.legend(loc="upper right", frameon=True)
    
    # Annotation for plateau
    ax.annotate("Hill Climbing bão hòa sớm (~5s)", xy=(5, 467), xytext=(12, 530),
                arrowprops=dict(arrowstyle="->", color="#1f77b4", lw=1.5),
                fontweight='semibold', color="#1f77b4")
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "figure1_convergence_curves.png"))
    plt.close()

def plot_stability_variance(data):
    scn01 = next((s for s in data["scenarios"] if s["scenario_id"] == "SCN-REAL-01"), None)
    if not scn01:
        return

    algos = ["HILL_CLIMBING", "SIMULATED_ANNEALING", "TABU_SEARCH"]
    algo_names = ["Hill Climbing", "Simulated Annealing", "Tabu Search"]
    
    means = []
    stds = []
    cvs = []
    
    for a in algos:
        if a in scn01["algorithms"]:
            st = scn01["algorithms"][a]["stats_60s_final"]
            means.append(st["mean"])
            stds.append(st["std_dev"])
            cvs.append(st["coefficient_of_variation_pct"])
        else:
            means.append(0)
            stds.append(0)
            cvs.append(0)

    x = np.arange(len(algos))
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)

    # Plot 1: Mean score and Std Dev error bar
    colors = ["#1f77b4", "#d62728", "#2ca02c"]
    bars = ax1.bar(x, means, yerr=stds, capsize=6, color=colors, alpha=0.85, edgecolor='black', width=0.5)
    ax1.set_title("Điểm phạt mềm cuối cùng (Mean ± StdDev)", fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(algo_names)
    ax1.set_ylabel("Điểm phạt mềm (S)")
    ax1.set_ylim(440, 500)
    ax1.grid(True, axis='y', linestyle='--', alpha=0.6)
    
    for bar, m in zip(bars, means):
        ax1.text(bar.get_x() + bar.get_width()/2., m + 2.5, f"{m:.1f}", ha='center', va='bottom', fontweight='bold')

    # Plot 2: Coefficient of Variation (CV%)
    bars2 = ax2.bar(x, cvs, color=colors, alpha=0.85, edgecolor='black', width=0.5)
    ax2.set_title("Hệ số biến thiên CV% (Tính ổn định giữa các Seed)", fontweight='bold')
    ax2.set_xticks(x)
    ax2.set_xticklabels(algo_names)
    ax2.set_ylabel("CV (%) = (σ / μ) × 100%")
    ax2.set_ylim(0, max(cvs) * 1.5 if max(cvs) > 0 else 2.0)
    ax2.grid(True, axis='y', linestyle='--', alpha=0.6)

    for bar, cv in zip(bars2, cvs):
        ax2.text(bar.get_x() + bar.get_width()/2., cv + 0.05, f"{cv:.2f}%", ha='center', va='bottom', fontweight='bold')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "figure2_stability_variance.png"))
    plt.close()

def plot_throughput(data):
    scn01 = next((s for s in data["scenarios"] if s["scenario_id"] == "SCN-REAL-01"), None)
    if not scn01:
        return

    algos = ["HILL_CLIMBING", "SIMULATED_ANNEALING", "TABU_SEARCH"]
    algo_names = ["Hill Climbing", "Simulated Annealing", "Tabu Search\n(50 bước/vòng)"]
    
    iters_per_sec = []
    evals_per_sec = []
    for a in algos:
        if a in scn01["algorithms"]:
            it = scn01["algorithms"][a]["avg_iterations_per_sec"]
            iters_per_sec.append(it)
            # Tabu search evaluates 50 moves per iteration
            mult = 50 if a == "TABU_SEARCH" else 1
            evals_per_sec.append(it * mult)
        else:
            iters_per_sec.append(0)
            evals_per_sec.append(0)

    x = np.arange(len(algos))
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    
    width = 0.35
    ax.bar(x - width/2, [v/1000 for v in iters_per_sec], width, label="Vòng lặp/giây (k iterations/s)", color="#3b528b", edgecolor='black')
    ax.bar(x + width/2, [v/1000 for v in evals_per_sec], width, label="Số bước đánh giá/giây (k evals/s)", color="#5ec962", edgecolor='black')

    ax.set_title("Thông lượng tính toán (Computational Throughput trên 4 luồng)", pad=12, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(algo_names)
    ax.set_ylabel("Nghìn thao tác / giây (k/s)")
    ax.legend(loc="upper right", frameon=True)
    ax.grid(True, axis='y', linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "figure3_throughput_comparison.png"))
    plt.close()

def plot_manual_vs_optimized(data):
    scn02 = next((s for s in data["scenarios"] if s["scenario_id"] == "SCN-REAL-02"), None)
    if not scn02:
        return

    categories = ["Ca trống (S1)", "Ngày 1 ca (S2)", "Tổng ngày dạy (S3)", "Lec trùng khác (S6)"]
    manual_vals = [
        scn02["manual_baseline"]["gaps_S1"],
        scn02["manual_baseline"]["single_slot_days_S2"],
        scn02["manual_baseline"]["teaching_days_S3"],
        scn02["manual_baseline"]["cross_course_clashes_S6"]
    ]
    
    # Choose free or fixed
    opt_key = "free_teachers_sa_10s" if "free_teachers_sa_10s" in scn02 else "fixed_teachers_sa_10s"
    opt_run = scn02[opt_key]["runs"][0]
    opt_vals = [
        opt_run["gaps_S1"],
        opt_run["single_slot_days_S2"],
        opt_run["teaching_days_S3"],
        opt_run["cross_course_clashes_S6"]
    ]

    x = np.arange(len(categories))
    fig, ax = plt.subplots(figsize=(9, 4.8), dpi=300)
    width = 0.35

    b1 = ax.bar(x - width/2, manual_vals, width, label="TKB lịch sử lập tay (Khoa)", color="#e74c3c", edgecolor='black')
    b2 = ax.bar(x + width/2, opt_vals, width, label="TKB bộ giải tối ưu (ScheduleSolver)", color="#2ecc71", edgecolor='black')

    ax.set_title("So sánh chất lượng TKB: Lập tay thủ công vs. Bộ giải tối ưu hóa", pad=12, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.set_ylabel("Số lượng vi phạm / Số ngày")
    ax.legend(loc="upper right", frameon=True)
    ax.grid(True, axis='y', linestyle='--', alpha=0.6)

    for bar in b1:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 1, f"{int(h)}", ha='center', va='bottom', fontweight='bold', color='#c0392b')
    for bar in b2:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 1, f"{int(h)}", ha='center', va='bottom', fontweight='bold', color='#27ae60')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "figure4_manual_vs_optimized.png"))
    plt.close()

if __name__ == "__main__":
    main()
