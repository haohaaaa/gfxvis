# 第二部分：射影平面中的点与直线

我们这一部分主要研究

$$
\mathbb P^2.
$$

先统一符号。

一个射影点记作

$$
\mathbf p=
\begin{bmatrix}
x\\y\\w
\end{bmatrix},
$$

或者写成

$$
[x:y:w].
$$

这里要求

$$
\mathbf p\neq \mathbf 0.
$$

而且

$$
\mathbf p
\sim
\lambda \mathbf p,
\qquad
\lambda\neq 0.
$$

也就是说

$$
[x:y:w]
=

[\lambda x:\lambda y:\lambda w].
$$

这一点上一部分已经讲过。

现在我们要引入一个新的对象：

$$
\boxed{\text{射影直线}}
$$

并且你很快会发现一个很漂亮的现象：

$$
\boxed{
\text{射影点和射影直线的代数形式几乎完全对称}
}
$$

---

# 1. 先从普通二维直线开始

在普通二维仿射平面

$$
\mathbb R^2
$$

中，一条直线通常写成

$$
aX+bY+c=0.
$$

这里 $X,Y$ 是普通仿射坐标，而

$$
(a,b)\neq (0,0).
$$

例如

$$
X+2Y-3=0
$$

是一条普通二维直线。

现在我们希望把它放到

$$
\mathbb P^2
$$

里面。

---

# 2. 把仿射直线齐次化

对于有限射影点，我们有

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w},
$$

其中

$$
w\neq 0.
$$

把它代入普通直线方程

$$
aX+bY+c=0.
$$

得到

$$
a\frac{x}{w}
+
b\frac{y}{w}
+
c
=

0.

$$

两边乘上 $w$：

$$
ax+by+cw=0.
$$

因此普通二维直线

$$
aX+bY+c=0
$$

对应的射影直线是

$$
\boxed{
ax+by+cw=0
}
$$

这个方程是**齐次的**。

为什么说它齐次？

因为如果

$$
(x,y,w)
$$

满足

$$
ax+by+cw=0,
$$

那么对于任意

$$
\lambda\neq0,
$$

都有

$$
a(\lambda x)
+
b(\lambda y)
+
c(\lambda w)
=

\lambda(ax+by+cw)
=

0.

$$

所以如果一个代表向量在直线上，那么这个射影点的所有代表向量都在直线上。

这正是我们想要的。

---

# 3. 直线本身也可以写成向量

定义

$$
\mathbf l
=

\begin{bmatrix}
a\\b\\c
\end{bmatrix}.
$$

那么直线方程

$$
ax+by+cw=0
$$

可以写成

$$
\boxed{
\mathbf l^{\mathsf T}\mathbf p=0
}
$$

因为

$$
\mathbf l^{\mathsf T}\mathbf p
=

\begin{bmatrix}
a&b&c
\end{bmatrix}
\begin{bmatrix}
x\\y\\w
\end{bmatrix}
=

ax+by+cw.
$$

于是：

$$
\boxed{
\mathbf p\text{ 在 }\mathbf l\text{ 上}
\iff
\mathbf l^{\mathsf T}\mathbf p=0
}
$$

这叫做点与直线之间的 **incidence relation**，中文通常说：

$$
\boxed{\text{关联关系}}
$$

或者理解为：

> 点和直线彼此“相接”。

---

# 4. 一个简单例子

考虑仿射直线

$$
X+2Y-3=0.
$$

对应射影直线

$$
x+2y-3w=0.
$$

所以可以用向量表示为

$$
\mathbf l
=

\begin{bmatrix}
1\\
2\\
-3
\end{bmatrix}.
$$

现在考虑普通点

$$
(1,1).
$$

它的标准齐次坐标是

$$
\mathbf p
=

\begin{bmatrix}
1\\1\\1
\end{bmatrix}.
$$

计算

$$
\mathbf l^{\mathsf T}\mathbf p
=

1\cdot1
+
2\cdot1
-

3\cdot1.
$$

所以

$$
\mathbf l^{\mathsf T}\mathbf p
=

1+2-3
=

0.

$$

因此

$$
[1:1:1]
$$

确实位于这条射影直线上。

---

# 5. 再换一个齐次代表

同一个射影点也可以写成

$$
[2:2:2].
$$

计算：

$$
1\cdot2
+
2\cdot2
-

3\cdot2
=

2+4-6
=

0.

$$

仍然成立。

所以：

$$
\boxed{
\mathbf l^{\mathsf T}\mathbf p=0
}
$$

确实与齐次坐标代表的选择无关。

---

# 6. 更有趣的是：直线坐标自己也是齐次的

考虑

$$
\mathbf l
=

\begin{bmatrix}
1\\2\\-3
\end{bmatrix}.
$$

直线方程是

$$
x+2y-3w=0.
$$

如果把整个方程乘以 $2$，得到

$$
2x+4y-6w=0.
$$

它显然还是同一条直线。

所以

$$
\begin{bmatrix}
1\\2\\-3
\end{bmatrix}
$$

和

$$
\begin{bmatrix}
2\\4\\-6
\end{bmatrix}
$$

代表同一条射影直线。

因此：

$$
\boxed{
[a:b:c]
=

[\lambda a:\lambda b:\lambda c]
}
$$

其中

$$
\lambda\neq0.
$$

有没有发现？

这和射影点的定义完全一样。

射影点：

$$
[x:y:w].
$$

射影直线：

$$
[a:b:c].
$$

两者都是三元组，而且都只定义到一个非零比例因子。

这就是射影几何中点线对偶性的第一个迹象。

---

# 7. 为什么一条直线可以看成 $\mathbb R^3$ 中的平面？

这里非常值得仔细理解。

直线

$$
ax+by+cw=0
$$

现在是在

$$
\mathbb R^3
$$

中考虑的。

它不是 $\mathbb R^3$ 中的一条线。

它实际上是一个**经过原点的二维平面**。

例如

$$
x+y-w=0
$$

描述的是 $\mathbb R^3$ 中一个穿过原点的平面。

为什么一定经过原点？

把

$$
(x,y,w)=(0,0,0)
$$

代进去：

$$
0+0-0=0.
$$

所以原点一定属于它。

而这个平面中的每一条过原点的一维子空间，都对应

$$
\mathbb P^2
$$

中的一个射影点。

因此：

$$
\boxed{
\mathbb P^2\text{ 中的一条射影直线}
}
$$

对应：

$$
\boxed{
\mathbb R^3\text{ 中的一个过原点二维线性子空间}
}
$$

这和上一章形成漂亮的对应：

$$
\mathbb P^2\text{ 中的点}
\leftrightarrow
\mathbb R^3\text{ 中的一维线性子空间},
$$

而

$$
\mathbb P^2\text{ 中的直线}
\leftrightarrow
\mathbb R^3\text{ 中的二维线性子空间}.
$$

---

# 8. 为什么 $\mathbf l$ 可以代表这个平面？

考虑

$$
\mathbf l=
\begin{bmatrix}
a\\b\\c
\end{bmatrix}.
$$

平面定义为：

$$
\mathbf l^{\mathsf T}\mathbf p=0.
$$

也就是说

$$
\mathbf p
$$

必须与

$$
\mathbf l
$$

正交。

所以

$$
\mathbf l
$$

实际上是这个二维平面的法向量。

因此射影直线坐标

$$
[a:b:c]
$$

本质上是：

$$
\boxed{
对应二维线性子空间的法向量
}
$$

这就是为什么直线天然可以用三个数表示。

---

# 9. 两个射影点如何确定一条直线？

这是射影几何第一个非常实用的计算。

假设我们有两个不同的射影点：

$$
\mathbf p_1
=

\begin{bmatrix}
x_1\\y_1\\w_1
\end{bmatrix},
$$

和

$$
\mathbf p_2
=

\begin{bmatrix}
x_2\\y_2\\w_2
\end{bmatrix}.
$$

我们想求经过它们的射影直线

$$
\mathbf l
=

\begin{bmatrix}
a\\b\\c
\end{bmatrix}.
$$

因为两个点都在线上，所以必须满足

$$
\mathbf l^{\mathsf T}\mathbf p_1=0
$$

以及

$$
\mathbf l^{\mathsf T}\mathbf p_2=0.
$$

也就是说：

$$
ax_1+by_1+cw_1=0,
$$

$$
ax_2+by_2+cw_2=0.
$$

我们需要找一个向量

$$
\mathbf l
$$

同时垂直于

$$
\mathbf p_1
$$

和

$$
\mathbf p_2.
$$

而在线性代数中，哪个运算会产生一个同时垂直于两个三维向量的向量？

就是：

$$
\boxed{\text{叉积}}
$$

所以：

$$
\boxed{
\mathbf l
=

\mathbf p_1\times\mathbf p_2
}
$$

---

# 10. 我们不要直接接受公式，推导一下

定义

$$
\mathbf p_1=
\begin{bmatrix}
x_1\\y_1\\w_1
\end{bmatrix},
\qquad
\mathbf p_2=
\begin{bmatrix}
x_2\\y_2\\w_2
\end{bmatrix}.
$$

叉积展开：

$$
\mathbf p_1\times\mathbf p_2
=

\begin{bmatrix}
y_1w_2-w_1y_2\\
w_1x_2-x_1w_2\\
x_1y_2-y_1x_2
\end{bmatrix}.
$$

因此

$$
a=y_1w_2-w_1y_2,
$$

$$
b=w_1x_2-x_1w_2,
$$

$$
c=x_1y_2-y_1x_2.
$$

我们现在验证它确实经过

$$
\mathbf p_1.
$$

计算：

$$
\mathbf l^{\mathsf T}\mathbf p_1
=

ax_1+by_1+cw_1.
$$

代入 $a,b,c$：

$$
\mathbf l^{\mathsf T}\mathbf p_1
=

(y_1w_2-w_1y_2)x_1
+
(w_1x_2-x_1w_2)y_1
+
(x_1y_2-y_1x_2)w_1.
$$

完全展开：

$$
=

x_1y_1w_2
-

x_1w_1y_2
+
w_1x_2y_1
-

x_1w_2y_1
+
x_1y_2w_1
-

y_1x_2w_1.
$$

现在两两抵消：

$$
x_1y_1w_2-x_1w_2y_1=0,
$$

$$
-x_1w_1y_2+x_1y_2w_1=0,
$$

$$
w_1x_2y_1-y_1x_2w_1=0.
$$

所以：

$$
\mathbf l^{\mathsf T}\mathbf p_1=0.
$$

同理：

$$
\mathbf l^{\mathsf T}\mathbf p_2=0.
$$

所以这个叉积确实给出了经过两点的直线。

---

# 11. 一个最简单的数值例子

取普通点

$$
P_1=(1,1)
$$

和

$$
P_2=(3,2).
$$

对应齐次坐标：

$$
\mathbf p_1=
\begin{bmatrix}
1\\1\\1
\end{bmatrix},
\qquad
\mathbf p_2=
\begin{bmatrix}
3\\2\\1
\end{bmatrix}.
$$

求叉积：

$$
\mathbf l
=

\mathbf p_1\times\mathbf p_2.
$$

逐项计算：

$$
a
=

1\cdot1-1\cdot2
=

-1,
$$

$$
b
=

1\cdot3-1\cdot1
=

2,
$$

$$
c
=

1\cdot2-1\cdot3
=

-1.
$$

所以：

$$
\mathbf l=
\begin{bmatrix}
-1\\2\\-1
\end{bmatrix}.
$$

直线方程：

$$
-x+2y-w=0.
$$

在有限区域

$$
w=1
$$

中：

$$
-X+2Y-1=0.
$$

整理：

$$
2Y=X+1.
$$

所以：

$$
Y=\frac12X+\frac12.
$$

检查：

$$
X=1
$$

时，

$$
Y=\frac12+\frac12=1.
$$

而

$$
X=3
$$

时，

$$
Y=\frac32+\frac12=2.
$$

完全正确。

---

# 12. 为什么两点定一直线本质上是“张成二维子空间”

这里还能看到更深一层。

两个不等价的射影点

$$
[\mathbf p_1]
$$

和

$$
[\mathbf p_2]
$$

对应 $\mathbb R^3$ 中两条不同的一维子空间。

它们生成：

$$
\operatorname{span}(\mathbf p_1,\mathbf p_2).
$$

如果 $\mathbf p_1,\mathbf p_2$ 线性无关，这个 span 是二维线性子空间。

而刚才我们说过：

$$
\mathbb R^3
\text{ 中二维线性子空间}
$$

正好对应

$$
\mathbb P^2
\text{ 中射影直线}.
$$

所以“两点确定一条直线”在线性代数语言里其实就是：

$$
\boxed{
\text{两个一维子空间张成一个二维子空间}
}
$$

这比欧氏几何里的说法更本质。

---

# 13. 反过来：两条直线怎样求交点？

现在假设有两条不同射影直线：

$$
\mathbf l_1=
\begin{bmatrix}
a_1\\b_1\\c_1
\end{bmatrix},
$$

和

$$
\mathbf l_2=
\begin{bmatrix}
a_2\\b_2\\c_2
\end{bmatrix}.
$$

交点

$$
\mathbf p=
\begin{bmatrix}
x\\y\\w
\end{bmatrix}
$$

必须满足：

$$
\mathbf l_1^{\mathsf T}\mathbf p=0,
$$

$$
\mathbf l_2^{\mathsf T}\mathbf p=0.
$$

换句话说，

$$
\mathbf p
$$

同时垂直于

$$
\mathbf l_1
$$

和

$$
\mathbf l_2.
$$

于是又得到叉积：

$$
\boxed{
\mathbf p
=

\mathbf l_1\times\mathbf l_2
}
$$

所以我们得到极其对称的一对公式：

$$
\boxed{
\mathbf l=\mathbf p_1\times\mathbf p_2
}
$$

以及

$$
\boxed{
\mathbf p=\mathbf l_1\times\mathbf l_2
}
$$

这不是巧合。

这是**射影对偶性**在三维齐次坐标中的具体表现。

---

# 14. 一个普通交点的例子

考虑两条仿射直线：

$$
L_1:
Y=X,
$$

$$
L_2:
Y=-X+2.
$$

先齐次化。

第一条：

$$
Y-X=0.
$$

所以：

$$
y-x=0.
$$

对应：

$$
\mathbf l_1=
\begin{bmatrix}
-1\\
1\\
0
\end{bmatrix}.
$$

第二条：

$$
X+Y-2=0.
$$

齐次化：

$$
x+y-2w=0.
$$

所以：

$$
\mathbf l_2=
\begin{bmatrix}
1\\
1\\
-2
\end{bmatrix}.
$$

现在求：

$$
\mathbf p
=

\mathbf l_1\times\mathbf l_2.
$$

计算：

$$
\mathbf p
=

\begin{bmatrix}
1(-2)-0(1)\\
0(1)-(-1)(-2)\\
(-1)(1)-1(1)
\end{bmatrix}.
$$

因此：

$$
\mathbf p
=

\begin{bmatrix}
-2\\
-2\\
-2
\end{bmatrix}.
$$

射影坐标允许整体除以 $-2$：

$$
[-2:-2:-2]
=

[1:1:1].
$$

所以普通仿射交点是

$$
(X,Y)=(1,1).
$$

和普通代数求交结果完全一致。

---

# 15. 现在看射影几何真正厉害的地方：平行线

考虑：

$$
L_1:Y=0,
$$

$$
L_2:Y=1.
$$

齐次形式分别为：

$$
y=0
$$

和

$$
y-w=0.
$$

所以

$$
\mathbf l_1=
\begin{bmatrix}
0\\1\\0
\end{bmatrix},
$$

$$
\mathbf l_2=
\begin{bmatrix}
0\\1\\-1
\end{bmatrix}.
$$

现在完全不需要写“它们平行，所以没有交点”。

直接算：

$$
\mathbf p
=

\mathbf l_1\times\mathbf l_2.
$$

根据叉积公式：

$$
x
=

b_1c_2-c_1b_2
=

1(-1)-0(1)
=

-1,
$$

$$
y
=

c_1a_2-a_1c_2
=

0\cdot0-0(-1)
=

0,
$$

$$
w
=

a_1b_2-b_1a_2
=

0\cdot1-1\cdot0
=

0.

$$

所以：

$$
\mathbf p=
\begin{bmatrix}
-1\\0\\0
\end{bmatrix}.
$$

乘上 $-1$：

$$
\boxed{
\mathbf p=[1:0:0]
}
$$

这就是它们的无穷远交点。

注意整个计算过程中没有任何特殊分支。

普通相交：

$$
\mathbf p=\mathbf l_1\times\mathbf l_2.
$$

平行：

$$
\mathbf p=\mathbf l_1\times\mathbf l_2.
$$

完全一样。

这就是射影几何非常适合计算机图形学和计算机视觉的原因之一：

$$
\boxed{
很多“特殊情况”被统一掉了
}
$$

---

# 16. 无穷远直线本身怎样表示？

上一章我们说过，无穷远点满足：

$$
w=0.
$$

因此无穷远直线的方程就是：

$$
0x+0y+1w=0.
$$

所以它的直线坐标是：

$$
\boxed{
\mathbf l_\infty
=

\begin{bmatrix}
0\\0\\1
\end{bmatrix}
}
$$

因为：

$$
\mathbf l_\infty^{\mathsf T}\mathbf p
=

\begin{bmatrix}
0&0&1
\end{bmatrix}
\begin{bmatrix}
x\\y\\w
\end{bmatrix}
=

w.
$$

所以：

$$
\mathbf l_\infty^{\mathsf T}\mathbf p=0
$$

恰好意味着：

$$
w=0.
$$

非常干净。

---

# 17. 一条普通直线如何找到自己的无穷远点？

考虑仿射直线：

$$
Y=mX+b.
$$

齐次化：

$$
y=mx+bw.
$$

整理：

$$
mx-y+bw=0.
$$

因此：

$$
\mathbf l
=

\begin{bmatrix}
m\\-1\\b
\end{bmatrix}.
$$

它与无穷远直线

$$
\mathbf l_\infty=
\begin{bmatrix}
0\\0\\1
\end{bmatrix}
$$

的交点是：

$$
\mathbf p_\infty
=

\mathbf l\times\mathbf l_\infty.
$$

计算：

$$
\mathbf p_\infty
=

\begin{bmatrix}
(-1)(1)-b(0)\\
b(0)-m(1)\\
m(0)-(-1)(0)
\end{bmatrix}.
$$

所以：

$$
\mathbf p_\infty
=

\begin{bmatrix}
-1\\
-m\\
0
\end{bmatrix}.
$$

乘上 $-1$：

$$
\boxed{
\mathbf p_\infty
=

[1:m:0]
}
$$

这恰好就是我们上一章得到的方向点。

于是可以重新解释：

$$
\boxed{
一条仿射直线的方向
=

它与无穷远直线的交点
}
$$

这是一个非常漂亮的射影几何解释。

---

# 18. 平行直线为什么有同一个无穷远点？

假设两条平行线：

$$
L_1:Y=mX+b_1,
$$

$$
L_2:Y=mX+b_2.
$$

它们的射影直线分别是：

$$
\mathbf l_1=
\begin{bmatrix}
m\\-1\\b_1
\end{bmatrix},
$$

$$
\mathbf l_2=
\begin{bmatrix}
m\\-1\\b_2
\end{bmatrix}.
$$

两条线和无穷远直线的交点分别是：

$$
\mathbf p_{\infty,1}
=

\mathbf l_1\times\mathbf l_\infty
=

[1:m:0],
$$

以及

$$
\mathbf p_{\infty,2}
=

\mathbf l_2\times\mathbf l_\infty
=

[1:m:0].
$$

所以：

$$
\boxed{
\mathbf p_{\infty,1}
=

\mathbf p_{\infty,2}
}
$$

也就是说：

> 平行线拥有共同方向，而在射影几何里，“共同方向”就是“共同无穷远点”。

---

# 19. 点、直线和矩阵秩

现在再用线性代数语言理解一次。

假设两个点为

$$
\mathbf p_1,\mathbf p_2.
$$

我们要求直线

$$
\mathbf l
$$

满足：

$$
\mathbf p_1^{\mathsf T}\mathbf l=0,
$$

$$
\mathbf p_2^{\mathsf T}\mathbf l=0.
$$

可以写成矩阵形式：

$$
\begin{bmatrix}
\mathbf p_1^{\mathsf T}\\
\mathbf p_2^{\mathsf T}
\end{bmatrix}
\mathbf l
=

\mathbf 0.
$$

也就是(这里就是零空间的定义)：

$$
\begin{bmatrix}
x_1&y_1&w_1\\
x_2&y_2&w_2
\end{bmatrix}
\begin{bmatrix}
a\\b\\c
\end{bmatrix}
=

\begin{bmatrix}
0\\0
\end{bmatrix}.
$$

如果两个射影点不同，那么

$$
\mathbf p_1,\mathbf p_2
$$

线性无关，因此这个 $2\times3$ 矩阵通常秩为

$$
2.
$$

根据秩-零化度定理：

$$
\dim(\ker A)
=
\dim{l} - \operatorname{rank}(A).
$$

所以：

$$
\dim(\ker A)
=

3-2
=

1.

$$

因此所有解

$$
\mathbf l
$$

组成一个一维子空间。

换句话说：

$$
\mathbf l
$$

只确定到非零比例。

这正好符合射影直线：

$$
[a:b:c].
$$

所以“两点唯一确定一条射影直线”在代数上其实就是：

$$
\boxed{
一个秩为2的齐次线性方程组有一维零空间
}
$$

---

# 20. 为什么叉积会自动给出这个零空间？

对于

$$
\mathbf p_1,\mathbf p_2\in\mathbb R^3,
$$

叉积

$$
\mathbf p_1\times\mathbf p_2
$$

满足：

$$
\mathbf p_1^{\mathsf T}
(\mathbf p_1\times\mathbf p_2)
=

0,
$$

同时：

$$
\mathbf p_2^{\mathsf T}
(\mathbf p_1\times\mathbf p_2)
=

0.

$$

所以它恰好属于上述矩阵的零空间。

而零空间只有一维，因此它必然就是那条唯一的射影直线坐标。

所以叉积不是一个神奇口诀。

它其实是：

$$
\boxed{
求两个三维向量共同正交方向的一种显式公式
}
$$

---

# 21. 一个容易混淆的地方：为什么点和直线都用三个数？

它们虽然都可以表示成三维向量，但是意义不同。

对于点：

$$
\mathbf p=
\begin{bmatrix}
x\\y\\w
\end{bmatrix},
$$

它代表 $\mathbb R^3$ 中的一条**一维子空间**。

对于直线：

$$
\mathbf l=
\begin{bmatrix}
a\\b\\c
\end{bmatrix},
$$

它作为法向量定义一个二维子空间：

$$
\{
\mathbf p:
\mathbf l^{\mathsf T}\mathbf p=0
\}.
$$

所以不要把它们理解为：

> 都是三个坐标，所以它们是同一种东西。

更准确地说：

$$
\boxed{
\mathbf p
\text{ 是 point coordinates}
}
$$

而

$$
\boxed{
\mathbf l
\text{ 是 line coordinates}
}
$$

只是因为 $\mathbb P^2$ 的特殊维度关系，它们恰好都需要三个齐次数。

---

# 22. 点线对偶开始出现了

现在比较下面两句话。

两点

$$
\mathbf p_1,\mathbf p_2
$$

确定一条直线：

$$
\boxed{
\mathbf l
=

\mathbf p_1\times\mathbf p_2
}
$$

两条直线

$$
\mathbf l_1,\mathbf l_2
$$

确定一个点：

$$
\boxed{
\mathbf p
=

\mathbf l_1\times\mathbf l_2
}
$$

再看 incidence：

$$
\boxed{
\mathbf l^{\mathsf T}\mathbf p=0
}
$$

如果把

$$
\mathbf p
$$

和

$$
\mathbf l
$$

交换，形式几乎没有变化：

$$
\mathbf p^{\mathsf T}\mathbf l=0.
$$

因为标量满足：

$$
\mathbf l^{\mathsf T}\mathbf p
=

\mathbf p^{\mathsf T}\mathbf l.
$$

于是射影几何中开始出现一种非常强的原则：

$$
\boxed{
\text{point}
\longleftrightarrow
\text{line}
}
$$

这就是：

$$
\boxed{
\text{projective duality}
}
$$

射影对偶性。

我们之后会正式讲。

---

# 23. 三个点什么时候共线？

这个问题现在也非常自然。

假设有三个射影点：

$$
\mathbf p_1,
\mathbf p_2,
\mathbf p_3.
$$

如果它们共线，那么存在同一个

$$
\mathbf l\neq0
$$

满足：

$$
\mathbf l^{\mathsf T}\mathbf p_1=0,
$$

$$
\mathbf l^{\mathsf T}\mathbf p_2=0,
$$

$$
\mathbf l^{\mathsf T}\mathbf p_3=0.
$$

也就是说：

$$
\mathbf p_1,\mathbf p_2,\mathbf p_3
$$

都属于同一个二维线性子空间。

因此三个向量线性相关。

所以：

$$
\boxed{
\det
\begin{bmatrix}
x_1&x_2&x_3\\
y_1&y_2&y_3\\
w_1&w_2&w_3
\end{bmatrix}
=

0
}
$$

当且仅当三个射影点共线。

---

# 24. 举例验证三个点共线

取：

$$
P_1=(0,1),
$$

$$
P_2=(1,3),
$$

$$
P_3=(2,5).
$$

显然它们都满足：

$$
Y=2X+1.
$$

齐次坐标：

$$
\mathbf p_1=
\begin{bmatrix}
0\\1\\1
\end{bmatrix},
$$

$$
\mathbf p_2=
\begin{bmatrix}
1\\3\\1
\end{bmatrix},
$$

$$
\mathbf p_3=
\begin{bmatrix}
2\\5\\1
\end{bmatrix}.
$$

构造矩阵：

$$
M=
\begin{bmatrix}
0&1&2\\
1&3&5\\
1&1&1
\end{bmatrix}.
$$

计算行列式。

按第一行展开：

$$
\det M
=

0
-

1
\begin{vmatrix}
1&5\\
1&1
\end{vmatrix}
+
2
\begin{vmatrix}
1&3\\
1&1
\end{vmatrix}.
$$

计算第一个二阶行列式：

$$
\begin{vmatrix}
1&5\\
1&1
\end{vmatrix}
=

1\cdot1-5\cdot1
=

-4.
$$

第二个：

$$
\begin{vmatrix}
1&3\\
1&1
\end{vmatrix}
=

1\cdot1-3\cdot1
=

-2.
$$

所以：

$$
\det M
=

-(-4)+2(-2).
$$

即：

$$
\det M
=

4-4
=

0.

$$

因此三个点共线。

---

# 25. 三条直线什么时候共点？

利用对偶性，完全类似。

如果有三条直线：

$$
\mathbf l_1,
\mathbf l_2,
\mathbf l_3,
$$

那么它们共点，当且仅当

$$
\mathbf l_1,\mathbf l_2,\mathbf l_3
$$

线性相关。

所以：

$$
\boxed{
\det
\begin{bmatrix}
a_1&a_2&a_3\\
b_1&b_2&b_3\\
c_1&c_2&c_3
\end{bmatrix}
=

0
}
$$

就是三线共点条件。

又是完全对称的。

---

# 26. 为什么射影几何特别喜欢行列式？

因为很多几何关系最终都变成：

$$
\text{线性相关}
$$

或者：

$$
\text{线性无关}.
$$

而行列式正好检测这个东西。

例如三个点：

$$
\mathbf p_1,\mathbf p_2,\mathbf p_3
$$

共线，

等价于：

$$
\operatorname{rank}
[\mathbf p_1\ \mathbf p_2\ \mathbf p_3]
<3,
$$

等价于：

$$
\det
[\mathbf p_1\ \mathbf p_2\ \mathbf p_3]
=0.
$$

因此射影几何里经常看到：

$$
\det(\cdots)=0.
$$

它背后的真正含义通常是：

$$
\boxed{
某些几何对象发生线性相关
}
$$

---

# 27. 现在再从 $\mathbb R^3$ 的角度统一理解

这一张心理图很重要。

在

$$
\mathbb P^2
$$

中，一个点

$$
P
$$

其实对应

$$
\mathbb R^3
$$

中的一条过原点直线：

$$
L_P.
$$

而一条射影直线

$$
\ell
$$

对应

$$
\mathbb R^3
$$

中的一个过原点平面：

$$
\Pi_\ell.
$$

那么：

$$
P\in\ell
$$

是什么意思？

就是：

$$
L_P\subset \Pi_\ell.
$$

而由于

$$
\Pi_\ell
=

\{
\mathbf x:
\mathbf l^{\mathsf T}\mathbf x=0
\},
$$

所以：

$$
L_P\subset\Pi_\ell
$$

等价于：

$$
\mathbf l^{\mathsf T}\mathbf p=0.
$$

因此 incidence 方程其实不是凭空规定的。

它就是：

$$
\boxed{
一条一维线性子空间包含于一个二维线性子空间
}
$$

的代数表达。

---

# 28. “两条射影直线一定相交”的线性代数原因

在

$$
\mathbb R^3
$$

中，两条射影直线对应两个过原点二维平面：

$$
\Pi_1,
\qquad
\Pi_2.
$$

两个不同的过原点二维平面，其交集通常是一条过原点直线。

也就是说：

$$
\Pi_1\cap\Pi_2
$$

是一个一维线性子空间。

而这个一维线性子空间对应：

$$
\mathbb P^2
$$

中的一个射影点。

所以：

$$
\boxed{
\mathbb P^2
\text{ 中任意两条不同射影直线一定相交}
}
$$

并不是什么人为添加的规则。

它本质上来自：

$$
\boxed{
\mathbb R^3
\text{ 中两个二维过原点平面的交集通常是一维}
}
$$

而“平行线”只不过恰好交在：

$$
w=0
$$

对应的那一维子空间。

---

# 29. 这也解释了为什么射影几何没有平行线这个例外

在欧氏几何里我们说：

$$
\text{两条非平行直线有一个交点}.
$$

于是“平行”成为特殊情况。

而射影几何把无穷远点加进来后：

$$
\boxed{
\text{任意两条不同射影直线都有唯一交点}
}
$$

“平行”不再是例外。

它只表示：

$$
\boxed{
交点恰好位于无穷远直线上
}
$$

这就是所谓：

$$
\boxed{
\text{projective completion}
}
$$

也就是把仿射平面“完备化”为射影平面。

---

# 30. 现在可以总结这一章最核心的公式

这一部分最值得牢牢记住的是：

1. 射影点：

$$
\mathbf p=
[x:y:w].
$$

射影直线：

$$
\mathbf l=
[a:b:c].
$$

点在线上：

$$
\boxed{
\mathbf l^{\mathsf T}\mathbf p=0
}
$$

两点定直线：

$$
\boxed{
\mathbf l
=

\mathbf p_1\times\mathbf p_2
}
$$

两线定交点：

$$
\boxed{
\mathbf p
=

\mathbf l_1\times\mathbf l_2
}
$$

三个点共线：

$$
\boxed{
\det[\mathbf p_1\ \mathbf p_2\ \mathbf p_3]=0
}
$$

三条线共点：

$$
\boxed{
\det[\mathbf l_1\ \mathbf l_2\ \mathbf l_3]=0
}
$$

无穷远直线：

$$
\boxed{
\mathbf l_\infty=[0:0:1]
}
$$

方向为 $(1,m)$ 的无穷远点：

$$
\boxed{
\mathbf p_\infty=[1:m:0]
}
$$

---

这里其实已经出现了射影几何最核心的一种思维：

$$
\boxed{
\text{几何关系}
\quad\longrightarrow\quad
\text{线性相关、零空间、叉积、行列式}
}
$$

下一部分最适合继续讲 **射影子空间和超平面的一般理论**，把我们现在在

$$
\mathbb P^2
$$

中看到的现象推广到

$$
\mathbb P^n.
$$

尤其要回答一个很容易混淆、但极关键的问题：

$$
\boxed{
\mathbb P^n
\text{ 中的“直线”为什么对应 }
\mathbb R^{n+1}
\text{ 中二维线性子空间？}
}
$$

然后我们会得到一个统一公式：

$$
\boxed{
\mathbb P(V)
\text{ 中的 }k\text{ 维射影子空间}
\leftrightarrow
V\text{ 中的 }(k+1)\text{ 维线性子空间}
}
$$

这样你之前问的“一维子空间、仿射子空间、射影子空间、超平面到底是什么关系”就会全部串起来。
