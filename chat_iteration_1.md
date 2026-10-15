$$
\text{线性空间}
\;\longrightarrow\;
\text{仿射空间}
\;\longrightarrow\;
\text{射影空间}
$$

是一条非常自然的演化路线。

这一章先把最底层的骨架搭牢

---

# 0. 我们先约定符号

下面统一使用实数。

$$
\mathbb R^n
$$

表示 $n$ 维实向量空间。

例如

$$
\mathbb R^2
=

\left\{
\begin{pmatrix}
x\\y
\end{pmatrix}
:x,y\in\mathbb R
\right\}.
$$

而

$$
\mathbb P^n(\mathbb R)
$$

表示 $n$ 维**实射影空间**。

如果上下文明确，我会简写成

$$
\mathbb P^n.
$$

非常重要的一点是：

$$
\boxed{
\mathbb P^n
\text{ 是由 }
\mathbb R^{n+1}
\text{ 构造出来的}
}
$$

不是由 $\mathbb R^n$ 直接构造。

比如：

$$
\mathbb P^1
\leftarrow
\mathbb R^2,
$$

$$
\mathbb P^2
\leftarrow
\mathbb R^3,
$$

$$
\mathbb P^3
\leftarrow
\mathbb R^4.
$$

这件事后面会成为齐次坐标的核心。

---

# 1. 最简单的起点：普通向量

先看

$$
\mathbb R^2.
$$

里面一个向量比如

$$
\mathbf v=
\begin{pmatrix}
2\\1
\end{pmatrix}.
$$

另一个向量

$$
2\mathbf v
=

\begin{pmatrix}
4\\2
\end{pmatrix}.
$$

在线性代数里，

$$
\begin{pmatrix}
2\\1
\end{pmatrix}
\neq
\begin{pmatrix}
4\\2
\end{pmatrix}.
$$

它们是两个不同的向量。

但是注意，它们有一个共同特点：

它们都落在同一条经过原点的直线上。

这条直线是

$$
L
=

\left\{
\lambda
\begin{pmatrix}
2\\1
\end{pmatrix}
:
\lambda\in\mathbb R
\right\}.
$$

也就是

$$
L
=

\left\{
\begin{pmatrix}
2\lambda\\
\lambda
\end{pmatrix}
:
\lambda\in\mathbb R
\right\}.
$$

---

# 2. 什么叫“一维线性子空间”

这个概念是整个射影几何真正的起点。

取一个非零向量

$$
\mathbf v\in\mathbb R^{n+1},
\qquad
\mathbf v\neq \mathbf 0.
$$

考虑所有它的数乘：

$$
\lambda \mathbf v,
\qquad
\lambda\in\mathbb R.
$$

这些向量组成集合

$$
\operatorname{span}(\mathbf v)
=

\{
\lambda\mathbf v:
\lambda\in\mathbb R
\}.
$$

这就是一个**一维线性子空间**。

为什么叫一维？

因为只需要一个自由参数

$$
\lambda
$$

就能描述它。

---

## 一个具体例子

在 $\mathbb R^3$ 中，

$$
\mathbf v=
\begin{pmatrix}
1\\2\\3
\end{pmatrix}.
$$

那么

$$
\operatorname{span}(\mathbf v)
=

\left\{
\begin{pmatrix}
\lambda\\
2\lambda\\
3\lambda
\end{pmatrix}
:
\lambda\in\mathbb R
\right\}.
$$

这是穿过原点的一条三维空间中的直线。

例如下面所有向量：

$$
\begin{pmatrix}
1\\2\\3
\end{pmatrix},
$$

$$
\begin{pmatrix}
2\\4\\6
\end{pmatrix},
$$

$$
\begin{pmatrix}
-1\\-2\\-3
\end{pmatrix},
$$

$$
\begin{pmatrix}
100\\200\\300
\end{pmatrix}
$$

全都属于同一个一维线性子空间。

---

# 3. 射影几何做了一个非常关键的决定

射影几何说：

> 我不再关心这条经过原点的直线上，具体是哪一个非零向量。
>
> 我把整条直线本身，当成“一个点”。

这句话第一次看会非常反直觉。

因为在普通几何里：

> 点是点，直线是直线。

但在射影几何里：

$$
\boxed{
\mathbb P^n
\text{ 中的一个“点”}
=

\mathbb R^{n+1}
\text{ 中的一条过原点直线}
}
$$

这就是射影空间最核心的定义。

严格地说：

$$
\boxed{
\mathbb P^n(\mathbb R)
=

\{
\mathbb R^{n+1}
\text{ 中的一维线性子空间}
\}
}
$$

这句话值得反复看。

---

# 4. 从 $\mathbb R^2$ 构造 $\mathbb P^1$

我们先研究最简单的情况。

$$
\mathbb P^1
$$

来自

$$
\mathbb R^2.
$$

所以：

$$
\mathbb P^1
=

\{
\mathbb R^2
\text{ 中所有经过原点的直线}
\}.
$$

例如

$$
L_1
=

\operatorname{span}
\begin{pmatrix}
1\\0
\end{pmatrix},
$$

$$
L_2
=

\operatorname{span}
\begin{pmatrix}
1\\1
\end{pmatrix},
$$

$$
L_3
=

\operatorname{span}
\begin{pmatrix}
1\\2
\end{pmatrix},
$$

等等。

这些东西在线性空间 $\mathbb R^2$ 里是“直线”。

但是在

$$
\mathbb P^1
$$

里面，每一条都被视为**一个射影点**。

也就是说，我们把：

$$
\text{过原点的直线}
$$

压缩成了：

$$
\text{一个射影点}.
$$

---

# 5. 等价关系出现了

既然

$$
\begin{pmatrix}
1\\2
\end{pmatrix}
$$

和

$$
\begin{pmatrix}
2\\4
\end{pmatrix}
$$

都生成同一条直线，那么在射影几何看来，它们代表同一个射影点。

于是定义：

对于两个非零向量

$$
\mathbf x,\mathbf y\in\mathbb R^{n+1}\setminus\{\mathbf 0\},
$$

如果存在

$$
\lambda\in\mathbb R,
\qquad
\lambda\neq0,
$$

使得

$$
\mathbf y=\lambda\mathbf x,
$$

那么定义

$$
\mathbf x\sim\mathbf y.
$$

读作：

> $\mathbf x$ 与 $\mathbf y$ 射影等价。

---

## 例如

$$
\begin{pmatrix}
1\\2
\end{pmatrix}
\sim
\begin{pmatrix}
2\\4
\end{pmatrix}
$$

因为

$$
\begin{pmatrix}
2\\4
\end{pmatrix}
=

2
\begin{pmatrix}
1\\2
\end{pmatrix}.
$$

同样

$$
\begin{pmatrix}
1\\2
\end{pmatrix}
\sim
\begin{pmatrix}
-3\\-6
\end{pmatrix}
$$

因为

$$
\begin{pmatrix}
-3\\-6
\end{pmatrix}
=

-3
\begin{pmatrix}
1\\2
\end{pmatrix}.
$$

但

$$
\begin{pmatrix}
1\\2
\end{pmatrix}
\not\sim
\begin{pmatrix}
1\\3
\end{pmatrix}.
$$

因为不存在同一个非零 $\lambda$ 满足

$$
1=\lambda\cdot1
$$

同时又满足

$$
3=\lambda\cdot2.
$$

第一式要求

$$
\lambda=1,
$$

第二式要求

$$
\lambda=\frac32.
$$

矛盾。

所以不是同一个射影点。

---

# 6. 什么叫“等价类”

这是你之前问过的一个很重要的问题。

考虑

$$
\mathbf x=
\begin{pmatrix}
1\\2
\end{pmatrix}.
$$

它的等价类定义为

$$
[\mathbf x]
=

\{
\lambda\mathbf x:
\lambda\neq0
\}.
$$

所以

$$
\left[
\begin{pmatrix}
1\\2
\end{pmatrix}
\right]
=

\left\{
\begin{pmatrix}
\lambda\\
2\lambda
\end{pmatrix}
:
\lambda\neq0
\right\}.
$$

它包含：

$$
\begin{pmatrix}
1\\2
\end{pmatrix},
\quad
\begin{pmatrix}
2\\4
\end{pmatrix},
\quad
\begin{pmatrix}
-1\\-2
\end{pmatrix},
\quad
\begin{pmatrix}
100\\200
\end{pmatrix},
\quad\ldots
$$

这些不是许多个射影点。

而是：

$$
\boxed{
一个射影点的许多种坐标表示
}
$$

因此

$$
\mathbb P^n
$$

也可以写成：

$$
\boxed{
\mathbb P^n
=

\frac{
\mathbb R^{n+1}\setminus\{\mathbf0\}
}{
\sim
}
}
$$

这里的“除以”

$$
/\sim
$$

不是普通数字除法。

它的意思是：

> 把所有互相等价的向量打包成一个对象。

这叫**商集**。

---

# 7. 射影坐标从这里自然出现

假设

$$
\mathbf x
=

\begin{pmatrix}
x_0\\
x_1\\
\vdots\\
x_n
\end{pmatrix}
\neq
\mathbf0.
$$

那么这个向量所代表的射影点，通常写成

$$
[x_0:x_1:\cdots:x_n].
$$

注意这里用的是：

$$
:
$$

而不是逗号。

例如

$$
[1:2]
$$

是 $\mathbb P^1$ 中的点。

因为非零缩放不改变射影点，所以

$$
[1:2]
=

[2:4]
=

[-1:-2]
=

[100:200].
$$

这就是**齐次坐标**。

---

# 8. 为什么叫“齐次”坐标？

因为整体乘上一个非零标量，表示的对象不变：

$$
[x_0:x_1:\cdots:x_n]
=

[\lambda x_0:\lambda x_1:\cdots:\lambda x_n],
$$

其中

$$
\lambda\neq0.
$$

所以坐标的绝对大小没有意义。

只有：

$$
\boxed{
各个分量之间的比例
}
$$

有意义。

例如

$$
[2:4:6]
$$

本质上只表达比例

$$
2:4:6
=

1:2:3.
$$

因此

$$
[2:4:6]
=

[1:2:3].
$$

---

# 9. 现在来看最重要的例子：$\mathbb P^1$

一个

$$
\mathbb P^1
$$

中的点写成

$$
[x:w].
$$

其中不能同时为零：

$$
(x,w)\neq(0,0).
$$

并且

$$
[x:w]
=

[\lambda x:\lambda w].
$$

---

## 情况一：$w\neq0$

如果

$$
w\neq0,
$$

我们可以选择

$$
\lambda=\frac1w.
$$

于是

$$
[x:w]
=

\left[
\frac{x}{w}:1
\right].
$$

定义

$$
X=\frac{x}{w}.
$$

于是

$$
[x:w]
=

[X:1].
$$

因此所有满足

$$
w\neq0
$$

的射影点，都可以用一个普通实数

$$
X
$$

表示。

例如

$$
[6:2].
$$

因为

$$
w=2\neq0,
$$

除以 $2$：

$$
[6:2]
=

[3:1].
$$

所以它对应普通实数

$$
X=3.
$$

---

# 10. 于是普通实数轴藏在 $\mathbb P^1$ 里面

普通实数

$$
X\in\mathbb R
$$

对应射影点

$$
[X:1].
$$

比如：

$$
0
\leftrightarrow
[0:1],
$$

$$
1
\leftrightarrow
[1:1],
$$

$$
2
\leftrightarrow
[2:1],
$$

$$
-3
\leftrightarrow
[-3:1].
$$

所以我们得到了一个“普通部分”：

$$
\{[X:1]:X\in\mathbb R\}.
$$

这部分本质上就是

$$
\mathbb R.
$$

---

# 11. 但是还有一种情况：$w=0$

如果

$$
w=0,
$$

那么射影点形如

$$
[x:0].
$$

又因为齐次坐标不能全零，所以必须

$$
x\neq0.
$$

于是：

$$
[x:0]
=

[1:0].
$$

因为可以除以 $x$。

因此所有

$$
w=0
$$

的点其实只有一个：

$$
[1:0].
$$

这个点不对应任何有限实数，因为

$$
X=\frac{x}{w}
$$

会变成

$$
\frac{1}{0}.
$$

于是把它记作：

$$
\infty.
$$

所以：

$$
\boxed{
\mathbb P^1(\mathbb R)
\cong
\mathbb R\cup\{\infty\}
}
$$

这里的

$$
\cong
$$

可以先理解成“在适当意义上等同”。

---

# 13. 现在从 $\mathbb P^1$ 升到 $\mathbb P^2$

这一步就是计算机图形学里最重要的情况。

$$
\mathbb P^2
$$

由

$$
\mathbb R^3
$$

中的一维线性子空间组成。

所以一个射影点写成：

$$
[x:y:w].
$$

并且：

$$
[x:y:w]
=

[\lambda x:\lambda y:\lambda w],
\qquad
\lambda\neq0.
$$

---

# 14. 当 $w\neq0$

如果

$$
w\neq0,
$$

我们同样除以 $w$：

$$
[x:y:w]
=

\left[
\frac{x}{w}:
\frac{y}{w}:
1
\right].
$$

定义普通二维坐标：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

那么：

$$
[x:y:w]
=

[X:Y:1].
$$

于是普通二维平面

$$
\mathbb R^2
$$

被嵌进

$$
\mathbb P^2
$$

中：

$$
(X,Y)
\longleftrightarrow
[X:Y:1].
$$

比如普通点

$$
(2,3)
$$

对应

$$
[2:3:1].
$$

而

$$
[4:6:2]
$$

也是同一个射影点，因为

$$
[4:6:2]
=

[2:3:1].
$$

---

# 15. 从三维空间看这件事

这一幅心理图像非常重要。

我们现在站在：

$$
\mathbb R^3
$$

里。

取平面：

$$
w=1.
$$

这个平面可以看成普通二维仿射平面。

例如普通二维点

$$
(X,Y)
$$

对应三维中的：

$$
(X,Y,1).
$$

现在从原点

$$
O=(0,0,0)
$$

向

$$
(X,Y,1)
$$

画一条直线。

这条直线是：

$$
\lambda
\begin{pmatrix}
X\\Y\\1
\end{pmatrix}.
$$

这整条直线就是一个射影点。

普通仿射点只是：

> 这个射影点所对应的射线/直线与 $w=1$ 平面的交点。

这是一个非常深刻的视角。

也就是说：

$$
\boxed{
仿射点其实可以看成射影点的一种“规范化代表”
}
$$

---

# 16. “齐次归一化”到底在干什么

例如：

$$
[6:9:3].
$$

它代表 $\mathbb R^3$ 中的一条直线：

$$
\lambda
\begin{pmatrix}
6\\9\\3
\end{pmatrix}.
$$

为了得到它在

$$
w=1
$$

平面上的交点，我们要求：

$$
3\lambda=1.
$$

因此：

$$
\lambda=\frac13.
$$

于是：

$$
\lambda
\begin{pmatrix}
6\\9\\3
\end{pmatrix}
=

\frac13
\begin{pmatrix}
6\\9\\3
\end{pmatrix}
=

\begin{pmatrix}
2\\3\\1
\end{pmatrix}.
$$

所以：

$$
[6:9:3]
=

[2:3:1].
$$

最终普通坐标为：

$$
(X,Y)=(2,3).
$$

所以所谓：

$$
\boxed{
\text{homogeneous divide}
}
$$

或者：

$$
\boxed{
\text{perspective divide}
}
$$

本质上就是：

> 在这条射影直线上选择唯一一个落在 $w=1$ 仿射超平面上的代表。

公式：

$$
[x:y:w]
\longmapsto
\left(
\frac{x}{w},
\frac{y}{w}
\right).
$$

---

# 17. 那 $w=0$ 是什么？

这就进入射影几何最漂亮的部分了。

考虑：

$$
[x:y:0].
$$

由于齐次坐标不能全为零：

$$
(x,y)\neq(0,0).
$$

你想把它归一化到

$$
w=1,
$$

需要找 $\lambda$ 满足

$$
\lambda\cdot0=1.
$$

但：

$$
0=1
$$

显然不可能。

所以：

$$
[x:y:0]
$$

对应的那条经过原点的直线，永远不会与

$$
w=1
$$

平面相交。

为什么？

因为这条线上的任意一点都有：

$$
w=0.
$$

它整个平行于

$$
w=1
$$

平面。

于是这种射影点被称为：

$$
\boxed{
无穷远点
}
$$

---

# 18. 一个无穷远点代表什么？

比如：

$$
[1:0:0].
$$

这表示方向：

$$
(1,0).
$$

可以把它理解成：

> $x$ 轴正负方向共同对应的射影方向。

注意，因为

$$
[1:0:0]
=

[-1:0:0].
$$

所以射影几何里，“方向”其实没有正负区别。

同样：

$$
[1:1:0]
$$

代表斜率为

$$
1
$$

的方向。

而：

$$
[2:2:0]
=

[1:1:0].
$$

因为它们只是整体缩放。

所以：

$$
\boxed{
w=0
\text{ 的点可以理解成方向}
}
$$

这一点对于计算机图形学尤其重要。

---

# 19. 为什么平行线会在无穷远处相交？

现在终于能严谨解释这句话。

考虑二维仿射平面中的两条平行线：

$$
L_1:y=0,
$$

和

$$
L_2:y=1.
$$

它们显然平行。

在普通欧氏几何中没有交点。

---

## 把第一条线写成齐次形式

普通坐标满足：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

原方程：

$$
Y=0.
$$

代入：

$$
\frac{y}{w}=0.
$$

乘以 $w$：

$$
y=0.
$$

所以射影化以后：

$$
L_1:y=0.
$$

---

## 第二条线

原来：

$$
Y=1.
$$

代入：

$$
\frac{y}{w}=1.
$$

两边乘 $w$：

$$
y=w.
$$

所以：

$$
L_2:y-w=0.
$$

---

# 20. 求它们的射影交点

交点必须同时满足：

$$
y=0
$$

以及

$$
y-w=0.
$$

由第一式：

$$
y=0.
$$

代入第二式：

$$
0-w=0.
$$

因此：

$$
w=0.
$$

现在 $x$ 不能也为 $0$，否则：

$$
[x:y:w]=[0:0:0]
$$

不合法。

所以：

$$
x\neq0.
$$

因此交点：

$$
[x:0:0].
$$

所有这样的点都等价：

$$
[x:0:0]=[1:0:0].
$$

所以两条平行线在射影平面中的交点是：

$$
\boxed{
[1:0:0]
}
$$

这就是它们共同方向对应的无穷远点。

因此：

$$
\boxed{
平行线不是“没有交点”，
而是交于无穷远点
}
$$

这是射影几何对欧氏几何的一次统一。

---

# 21. 更一般地看平行线

考虑：

$$
Y=mX+b_1
$$

和

$$
Y=mX+b_2.
$$

其中：

$$
b_1\neq b_2.
$$

它们斜率相同，所以平行。

齐次化第一条：

$$
\frac{y}{w}
=

m\frac{x}{w}+b_1.
$$

两边乘 $w$：

$$
y=mx+b_1w.
$$

整理：

$$
mx-y+b_1w=0.
$$

第二条：

$$
mx-y+b_2w=0.
$$

交点同时满足两式。

相减：

$$
(b_1-b_2)w=0.
$$

由于：

$$
b_1\neq b_2,
$$

所以：

$$
w=0.
$$

代回：

$$
mx-y=0.
$$

因此：

$$
y=mx.
$$

可以取：

$$
x=1.
$$

于是交点为：

$$
\boxed{
[1:m:0]
}
$$

注意这个交点只取决于：

$$
m,
$$

而不取决于截距

$$
b_1,b_2.
$$

这正符合几何直觉：

> 所有斜率为 $m$ 的平行线都有同一个方向。

因此它们都通过同一个无穷远点：

$$
[1:m:0].
$$

---

# 22. 所有无穷远点本身又组成一条线

在

$$
\mathbb P^2
$$

里，无穷远点满足：

$$
w=0.
$$

所以：

$$
\boxed{
w=0
}
$$

本身是一条射影直线。

它叫：

$$
\boxed{
\text{line at infinity}
}
$$

即：

$$
\boxed{
无穷远直线
}
$$

于是：

$$
\mathbb P^2
$$

可以粗略理解为：

$$
\boxed{
\mathbb R^2
+
\text{一条无穷远直线}
}
$$

和一维情况形成鲜明对比：

$$
\mathbb P^1
=

\mathbb R
+
\text{一个无穷远点}.
$$

而：

$$
\mathbb P^2
=

\mathbb R^2
+
\mathbb P^1.
$$

因为无穷远直线本身其实就是一个

$$
\mathbb P^1.
$$

---

# 23. 一般的 $\mathbb P^n$

现在模式就清楚了。

射影空间：

$$
\mathbb P^n
$$

使用

$$
n+1
$$

个齐次坐标：

$$
[x_1:x_2:\cdots:x_n:w].
$$

这里最后一个坐标我特意写成：

$$
w.
$$

---

## 有限点

如果：

$$
w\neq0,
$$

那么：

$$
[x_1:\cdots:x_n:w]
=

\left[
\frac{x_1}{w}:
\cdots:
\frac{x_n}{w}:
1
\right].
$$

对应普通仿射点：

$$
\left(
\frac{x_1}{w},
\ldots,
\frac{x_n}{w}
\right)
\in\mathbb R^n.
$$

---

## 无穷远点

如果：

$$
w=0,
$$

则：

$$
[x_1:\cdots:x_n:0]
$$

代表无穷远方向。

所有这些点组成：

$$
w=0.
$$

这是一个

$$
(n-1)
$$

维射影空间：

$$
\boxed{
\mathbb P^{n-1}
}
$$

因此可以非常漂亮地写成：

$$
\boxed{
\mathbb P^n
=

\mathbb R^n
\cup
\mathbb P^{n-1}_{\infty}
}
$$

这里：

$$
\mathbb P^{n-1}_{\infty}
$$

就是无穷远超平面。

---

# 24. 这时候你应该重新理解“齐次坐标”

以前很容易把：

$$
(x,y)
\mapsto
(x,y,1)
$$

理解成：

> 在坐标后面随便加一个 $1$。

其实完全不是。

真正的逻辑是：

### 第一步

我们从仿射空间

$$
\mathbb R^2
$$

扩张到射影空间

$$
\mathbb P^2.
$$

### 第二步

射影点实际上是：

$$
\mathbb R^3
$$

中的一维线性子空间。

### 第三步

一个射影点有无穷多个坐标代表：

$$
[x:y:w]
=

[\lambda x:\lambda y:\lambda w].
$$

### 第四步

如果：

$$
w\neq0,
$$

我们挑选一个特殊代表，使：

$$
w=1.
$$

于是得到：

$$
[X:Y:1].
$$

### 第五步

然后把它和普通仿射点：

$$
(X,Y)
$$

对应起来。

所以：

$$
\boxed{
(X,Y,1)
}
$$

不是齐次坐标的定义。

它只是一个射影等价类中的**标准代表**。

---

# 26. 一个很重要的术语：affine chart

我们选择：

$$
w\neq0
$$

这一部分，然后规定：

$$
w=1.
$$

得到：

$$
[x_1:\cdots:x_n:1].
$$

这块区域叫一个**仿射图**：

$$
\boxed{
\text{affine chart}
}
$$

记作例如：

$$
U_w
=

\{
[x_1:\cdots:x_n:w]:w/neq0
w\neq0
\}.
$$

在这张图里，可以定义普通坐标：

$$
X_i=\frac{x_i}{w}.
$$

于是：

$$
U_w\cong\mathbb R^n.
$$

---

# 27. 但是 $w$ 并不是天生特殊的

这是非常值得深挖的一点。

例如在：

$$
\mathbb P^2
$$

中，我们通常使用：

$$
w\neq0
$$

作为仿射区域。

但完全可以使用：

$$
x\neq0.
$$

如果：

$$
x\neq0,
$$

就可以除以 $x$：

$$
[x:y:w]
=

\left[
1:
\frac yx:
\frac wx
\right].
$$

于是使用：

$$
\frac yx,\qquad\frac wx
$$

作为局部坐标。

同理还可以使用：

$$
y\neq0.
$$

因此：

$$
\mathbb P^2
$$

可以用三张仿射图覆盖：

$$
U_x=\{x\neq0\},
$$

$$
U_y=\{y\neq0\},
$$

$$
U_w=\{w\neq0\}.
$$

这一点已经开始进入真正的射影几何和微分几何思想了。

---

# 28. 所以“无穷远”其实是相对于某张仿射图而言的

这点非常深。

在我们选定：

$$
w=1
$$

这张仿射图时：

$$
w=0
$$

被叫做“无穷远”。

但在整个射影空间里：

$$
w=0
$$

的点并不比

$$
w\neq0
$$

的点更奇怪。

它们都是普通的射影点。

所以：

$$
\boxed{
“无穷远”不是射影空间本身具有的绝对概念
}
$$

它来自于：

> 你选择了哪一个仿射部分作为“普通有限空间”。

这是射影几何一个非常重要的思想转变。

---

# 29. 射影点真正应该理解成“方向射线”吗？

这里要稍微修正一种常见说法。

经常有人说：

> 射影点就是从原点发出的一条射线。

这在直觉上有帮助，但严格来说不准确。

因为：

$$
\mathbf x
\sim
\lambda\mathbf x
$$

允许：

$$
\lambda<0.
$$

因此：

$$
\mathbf x
\sim-\mathbf x.
$$

也就是说，正反两个方向也被认作同一个射影点。

所以准确说法是：

$$
\boxed{
射影点
=

经过原点的一整条直线
}
$$

而不是半条射线。

---

# 30. 一个非常直观的例子

在：

$$
\mathbb P^1
$$

里，

$$
[1:1]
$$

和：

$$
[-1:-1]
$$

是同一个点：

$$
[1:1]=[-1:-1].
$$

因为：

$$
(-1,-1)
=

-1(1,1).
$$

所以原点两侧实际上被识别在一起：

整个直线是一整个射影点。

---

# 32. 射影空间与线性代数真正的联系

这里是射影几何最强大的地方。

在仿射几何里，平移：

$$
\mathbf x\mapsto A\mathbf x+\mathbf b
$$

不是线性变换，因为：

$$
\mathbf 0
$$

通常不会映射到：

$$
\mathbf 0.
$$

但是进入齐次坐标后：

$$
\begin{pmatrix}
\mathbf x\\
1
\end{pmatrix}
$$

可以写：

$$
\begin{pmatrix}
A&\mathbf b\\
0&1
\end{pmatrix}
\begin{pmatrix}
\mathbf x\\
1
\end{pmatrix}.
$$

于是：

$$
\boxed{
仿射变换变成了更高维空间中的线性变换
}
$$

再进一步，透视变换也可以写成矩阵：

$$
\mathbf x'
\sim
H\mathbf x.
$$

这就是：

$$
\boxed{
projective transformation
}
$$

射影变换。

于是计算机图形学中：

$$
\text{Model}
\to
\text{View}
\to
\text{Projection}
$$

可以统一写成矩阵乘法。

这不是“齐次坐标技巧”。

而是因为：

$$
\boxed{
计算机图形学实际上大量工作在射影几何中
}
$$

---

# 34. 一个特别值得记住的“三层对象”

以后看到：

$$
[2:4:2]
$$

不要只看到三个数字。

应该脑内同时出现三个层次。

### 第一层：$\mathbb R^3$ 中的向量

例如代表向量：

$$
\begin{pmatrix}
2\\4\\2
\end{pmatrix}.
$$

---

### 第二层：$\mathbb R^3$ 中的一维线性子空间

$$
L
=

\left\{
\lambda
\begin{pmatrix}
2\\4\\2
\end{pmatrix}
:
\lambda\in\mathbb R
\right\}.
$$

---

### 第三层：$\mathbb P^2$ 中的一个射影点

$$
[2:4:2].
$$

然后因为：

$$
w=2\neq0,
$$

可以选取 $w=1$ 的代表：

$$
[1:2:1].
$$

于是对应普通仿射点：

$$
(1,2).
$$

所以整个链条是：

$$
\begin{pmatrix}
2\\4\\2
\end{pmatrix}
$$

生成

$$
\operatorname{span}
\begin{pmatrix}
2\\4\\2
\end{pmatrix},
$$

它对应射影点

$$
[2:4:2],
$$

而在 $w=1$ 仿射图中对应

$$
(1,2).
$$

这四个东西：

$$
\boxed{
\text{向量}
\neq
\text{线性子空间}
\neq
\text{射影点}
\neq
\text{仿射坐标表示}
}
$$

一定要分开。

---
