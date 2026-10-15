好。下一章正式进入射影几何里最重要的“变换”部分：

# 第四部分：射影变换 Projective Transformation / Homography

这一章会把前面学过的东西真正“动起来”。

前面我们一直在研究：

$$
\mathbb P^n
$$

里面有什么点、直线、子空间、超平面。

现在开始研究：

$$
\boxed{
\mathbb P^n\longrightarrow\mathbb P^n
}
$$

什么样的映射才是射影几何里最自然的变换？

最终答案会是：

$$
\boxed{
[\mathbf x]
\longmapsto
[H\mathbf x]
}
$$

其中

$$
H\in GL(n+1,\mathbb R).
$$

也经常简写成：

$$
\boxed{
\mathbf x'\sim H\mathbf x
}
$$

这就是射影变换。

但我们不要直接记公式。我们从“为什么它必然长这样”开始。

---

# 1. 先回忆：射影点本身不是一个向量

设

$$
V=\mathbb R^{n+1}.
$$

射影空间定义为：

$$
\mathbb P^n
=

\mathbb P(V)
=

(V\setminus\{\mathbf0\})/\sim,
$$

其中等价关系是：

$$
\mathbf x\sim\lambda\mathbf x,
\qquad
\lambda\neq0.
$$

因此一个射影点写成：

$$
[\mathbf x].
$$

注意：

$$
[\mathbf x]
$$

不是某一个具体向量。

而是整个等价类：

$$
[\mathbf x]
=

\{
\lambda\mathbf x:
\lambda\neq0
\}.
$$

例如：

$$
\begin{bmatrix}
1\\2\\1
\end{bmatrix},
\qquad
\begin{bmatrix}
2\\4\\2
\end{bmatrix},
\qquad
\begin{bmatrix}
-3\\-6\\-3
\end{bmatrix}
$$

全部代表同一个

$$
\mathbb P^2
$$

中的点。

所以任何想作用在射影空间上的变换，都必须尊重这个等价关系。

这是第一要求。

---

# 2. 我们从线性变换开始

设

$$
H:V\to V
$$

是一个线性变换。

如果选择基，可以写成矩阵：

$$
H\in\mathbb R^{(n+1)\times(n+1)}.
$$

于是：

$$
\mathbf x
\longmapsto
H\mathbf x.
$$

现在问题来了：

既然

$$
\mathbf x
$$

和

$$
\lambda\mathbf x
$$

代表同一个射影点，那么经过 $H$ 以后，它们是否仍然代表同一个射影点？

我们计算。

因为 $H$ 是线性的：

$$
H(\lambda\mathbf x)
=

\lambda H\mathbf x.
$$

于是：

$$
H(\lambda\mathbf x)
\sim
H\mathbf x.
$$

因此：

$$
[\mathbf x]
=

[\lambda\mathbf x]
$$

自动推出：

$$
[H\mathbf x]
=

[H(\lambda\mathbf x)].
$$

所以：

$$
\boxed{
\text{线性映射天然兼容射影等价关系}
}
$$

这就是为什么射影变换和线性代数如此紧密。

---

# 3. 因此可以尝试定义

我们想定义：

$$
T:\mathbb P^n\to\mathbb P^n
$$

为：

$$
\boxed{
T([\mathbf x])
=

[H\mathbf x]
}
$$

只要：

$$
H\mathbf x\neq\mathbf0.
$$

这里出现了一个新的问题。

如果某个非零向量满足：

$$
H\mathbf x=\mathbf0,
$$

那么我们得到：

$$
[\mathbf0].
$$

但：

$$
[\mathbf0]
$$

在射影空间里根本不存在。

因为零向量没有方向，也不能代表一维线性子空间。

所以为了让

$$
T([\mathbf x])
=[H\mathbf x]
$$

对所有射影点都有定义，我们必须保证：

$$
\mathbf x\neq0
\quad\Longrightarrow\quad
H\mathbf x\neq0.
$$

这意味着：

$$
\ker H=\{\mathbf0\}.
$$

对于有限维方阵来说，这等价于：

$$
H
$$

可逆。

所以必须：

$$
\boxed{
H\in GL(n+1,\mathbb R)
}
$$

其中：

$$
GL(n+1,\mathbb R)
$$

表示所有可逆的

$$
(n+1)\times(n+1)
$$

实矩阵组成的群。

---

# 4. 为什么“可逆”如此重要？

我们一步一步看。

如果：

$$
H
$$

不可逆，那么：

$$
\det H=0.
$$

于是存在：

$$
\mathbf x\neq0
$$

满足：

$$
H\mathbf x=\mathbf0.
$$

那么射影点：

$$
[\mathbf x]
$$

被映射到了不存在的：

$$
[\mathbf0].
$$

所以这不能成为整个

$$
\mathbb P^n
$$

上的射影自同构。

反过来，如果：

$$
H
$$

可逆，那么：

$$
H\mathbf x=\mathbf0
$$

只能推出：

$$
\mathbf x=\mathbf0.
$$

因此对于所有合法射影点：

$$
[\mathbf x],
$$

都有：

$$
H\mathbf x\neq0.
$$

于是：

$$
[H\mathbf x]
$$

永远合法。

而且因为 $H^{-1}$ 也存在，所以变换还可以倒过来。

因此真正意义上的射影变换是：

$$
\boxed{
T_H:
[\mathbf x]\mapsto[H\mathbf x],
\qquad
H\in GL(n+1,\mathbb R)
}
$$

---

# 5. 为什么经常写成

$$
\mathbf x'\sim H\mathbf x?
$$

因为：

$$
\mathbf x'
$$

只是输出射影点的某个代表。

严格地说，我们得到的是：

$$
[\mathbf x']
=

[H\mathbf x].
$$

因此：

$$
\mathbf x'
$$

不一定严格等于：

$$
H\mathbf x.
$$

只需要相差一个非零比例：

$$
\mathbf x'
=

\lambda H\mathbf x,
\qquad
\lambda\neq0.
$$

因此通常简写成：

$$
\boxed{
\mathbf x'
\sim
H\mathbf x
}
$$

这里的

$$
\sim
$$

就是射影等价。

---

# 6. 一个非常简单的 $\mathbb P^1$ 例子

设：

$$
H=
\begin{bmatrix}
2&0\\
0&1
\end{bmatrix}.
$$

射影点：

$$
[x:w].
$$

经过变换：

$$
\begin{bmatrix}
x'\\w'
\end{bmatrix}
=

\begin{bmatrix}
2&0\\
0&1
\end{bmatrix}
\begin{bmatrix}
x\\w
\end{bmatrix}.
$$

所以：

$$
x'=2x,
$$

$$
w'=w.
$$

在仿射图：

$$
w\neq0
$$

中定义普通坐标：

$$
X=\frac{x}{w}.
$$

输出坐标：

$$
X'
=

\frac{x'}{w'}.
$$

代入：

$$
X'
=

\frac{2x}{w}.
$$

因此：

$$
\boxed{
X'=2X
}
$$

所以一个普通的尺度变换，本身就是射影变换。

---

# 7. 再看一个更有意思的例子

设：

$$
H=
\begin{bmatrix}
1&1\\
0&1
\end{bmatrix}.
$$

那么：

$$
\begin{bmatrix}
x'\\w'
\end{bmatrix}
=

\begin{bmatrix}
1&1\\
0&1
\end{bmatrix}
\begin{bmatrix}
x\\w
\end{bmatrix}.
$$

所以：

$$
x'=x+w,
$$

$$
w'=w.
$$

普通坐标：

$$
X=\frac{x}{w}.
$$

于是：

$$
X'
=

\frac{x+w}{w}.
$$

拆开：

$$
X'
=

\frac{x}{w}+1.
$$

所以：

$$
\boxed{
X'=X+1
}
$$

这就是平移。

注意这个结果很重要：

在线性坐标 $X$ 中，

$$
X\mapsto X+1
$$

不是线性变换。

因为：

$$
0\mapsto1.
$$

但在齐次坐标中：

$$
\begin{bmatrix}
x\\w
\end{bmatrix}
\mapsto
\begin{bmatrix}
1&1\\
0&1
\end{bmatrix}
\begin{bmatrix}
x\\w
\end{bmatrix}
$$

却是线性的。

所以：

$$
\boxed{
\text{仿射变换可以通过齐次坐标提升成更高维线性变换}
}
$$

---

# 8. 现在看真正一般的 $\mathbb P^1$ 射影变换

设：

$$
H=
\begin{bmatrix}
a&b\\
c&d
\end{bmatrix},
$$

并要求：

$$
\det H
=

ad-bc
\neq0.
$$

射影点：

$$
[x:w].
$$

那么：

$$
\begin{bmatrix}
x'\\w'
\end{bmatrix}
=

H
\begin{bmatrix}
x\\w
\end{bmatrix}.
$$

所以：

$$
x'=ax+bw,
$$

$$
w'=cx+dw.
$$

在：

$$
w\neq0
$$

的仿射图中，定义：

$$
X=\frac{x}{w}.
$$

输出若满足：

$$
w'\neq0,
$$

则：

$$
X'
=

\frac{x'}{w'}.
$$

代入：

$$
X'
=

\frac{ax+bw}
{cx+dw}.
$$

现在分子分母同时除以 $w$：

$$
X'
=

\frac{
a\frac{x}{w}+b
}{
c\frac{x}{w}+d
}.
$$

由于：

$$
X=\frac{x}{w},
$$

于是：

$$
\boxed{
X'
=

\frac{aX+b}{cX+d}
}
$$

出现了。

这就是一维射影变换的经典形式：

$$
\boxed{
X\mapsto
\frac{aX+b}{cX+d}
}
$$

它叫：

- fractional linear transformation
- linear fractional transformation
- Möbius transformation（在适当情境下）

所以你之前一直碰到的：

$$
\boxed{
\frac{\text{线性函数}}
{\text{线性函数}}
}
$$

并不是偶然。

它正是：

$$
\boxed{
\text{高一维线性变换}
+
\text{齐次除法}
}
$$

在仿射坐标中的表现。

---

# 9. 为什么射影变换在仿射坐标中一般不是线性的？

因为齐次空间中先做：

$$
\mathbf x'
=

H\mathbf x,
$$

这是线性的。

但是最后从齐次坐标返回仿射坐标时，还要做：

$$
X_i'
=

\frac{x_i'}{w'}.
$$

所以最终变成：

$$
\frac{\text{线性表达式}}
{\text{另一个线性表达式}}.
$$

也就是说：

$$
\boxed{
\text{projective linear}
\neq
\text{affine linear}
}
$$

射影变换是齐次空间里的线性变换，但在某一张仿射图中表现为**分式线性关系**。

---

# 10. 推广到 $\mathbb P^2$

现在取：

$$
\mathbf p=
\begin{bmatrix}
x\\y\\w
\end{bmatrix}.
$$

设：

$$
H=
\begin{bmatrix}
h_{11}&h_{12}&h_{13}\\
h_{21}&h_{22}&h_{23}\\
h_{31}&h_{32}&h_{33}
\end{bmatrix},
$$

其中：

$$
\det H\neq0.
$$

射影变换定义为：

$$
\mathbf p'
\sim
H\mathbf p.
$$

先按矩阵乘法得到：

$$
x'
=

h_{11}x+h_{12}y+h_{13}w,
$$

$$
y'
=

h_{21}x+h_{22}y+h_{23}w,
$$

$$
w'
=

h_{31}x+h_{32}y+h_{33}w.
$$

现在假设输入点在：

$$
w\neq0
$$

的仿射图中。

定义：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

输出若满足：

$$
w'\neq0,
$$

则：

$$
X'=\frac{x'}{w'},
$$

$$
Y'=\frac{y'}{w'}.
$$

代入上面的公式：

$$
X'
=

\frac{
h_{11}x+h_{12}y+h_{13}w
}{
h_{31}x+h_{32}y+h_{33}w
}.
$$

分子分母除以 $w$：

$$
\boxed{
X'
=

\frac{
h_{11}X+h_{12}Y+h_{13}
}{
h_{31}X+h_{32}Y+h_{33}
}
}
$$

同理：

$$
\boxed{
Y'
=

\frac{
h_{21}X+h_{22}Y+h_{23}
}{
h_{31}X+h_{32}Y+h_{33}
}
}
$$

这就是二维 homography 在仿射坐标中的一般形式。

---

# 11. 这里出现一个非常重要的共同分母

注意：

$$
X'
=

\frac{
h_{11}X+h_{12}Y+h_{13}
}{
h_{31}X+h_{32}Y+h_{33}
},
$$

$$
Y'
=

\frac{
h_{21}X+h_{22}Y+h_{23}
}{
h_{31}X+h_{32}Y+h_{33}
}.
$$

两个坐标共享同一个分母：

$$
h_{31}X+h_{32}Y+h_{33}.
$$

为什么？

因为这个分母就是：

$$
w'.
$$

更准确地说，在输入已经选择：

$$
w=1
$$

的情况下：

$$
w'
=

h_{31}X+h_{32}Y+h_{33}.
$$

然后输出坐标是：

$$
X'=\frac{x'}{w'},
\qquad
Y'=\frac{y'}{w'}.
$$

所以共同分母不是人为设计出来的。

它来自：

$$
\boxed{
\text{齐次归一化}
}
$$

---

# 12. 现在回答一个重要问题：为什么 $H$ 和 $\lambda H$ 是同一个射影变换？

设：

$$
\lambda\neq0.
$$

比较：

$$
H
$$

和：

$$
\lambda H.
$$

对于任意射影点：

$$
[\mathbf x],
$$

用 $H$ 得到：

$$
[H\mathbf x].
$$

用 $\lambda H$ 得到：

$$
[(\lambda H)\mathbf x].
$$

根据矩阵乘法：

$$
(\lambda H)\mathbf x
=

\lambda(H\mathbf x).
$$

所以：

$$
[(\lambda H)\mathbf x]
=

[\lambda H\mathbf x].
$$

而齐次坐标满足：

$$
[\lambda H\mathbf x]
=

[H\mathbf x].
$$

因此：

$$
\boxed{
H
\text{ 和 }
\lambda H
\text{ 表示同一个射影变换}
}
$$

只要：

$$
\lambda\neq0.
$$

---

# 13. 因此射影变换真正对应的不是 $GL$，而是 $PGL$

这里开始进入一个重要的代数结构。

所有可逆矩阵组成：

$$
GL(n+1,\mathbb R).
$$

但是：

$$
H
$$

和：

$$
\lambda H
$$

表示同一射影变换。

因此要进一步把所有只差非零标量倍数的矩阵识别起来。

定义：

$$
H\sim\lambda H.
$$

于是得到：

$$
\boxed{
PGL(n+1,\mathbb R)
=

GL(n+1,\mathbb R)/\mathbb R^\times
}
$$

这里：

$$
\mathbb R^\times
=

\mathbb R\setminus\{0\}.
$$

这个群叫：

$$
\boxed{
\text{projective general linear group}
}
$$

即：

$$
\boxed{
\text{射影一般线性群}
}
$$

所以严格来说：

$$
\boxed{
\mathbb P^n
\text{ 的射影线性变换属于 }
PGL(n+1,\mathbb R)
}
$$

而不是单纯的某一个 $H$。

---

# 14. 这也解释 homography 为什么“只差一个尺度”

在计算机视觉里，你经常会看到：

$$
H=
\begin{bmatrix}
h_{11}&h_{12}&h_{13}\\
h_{21}&h_{22}&h_{23}\\
h_{31}&h_{32}&h_{33}
\end{bmatrix}.
$$

它有 $9$ 个矩阵元素。

但：

$$
H
\sim
\lambda H.
$$

所以整体尺度没有意义。

因此有效自由度不是：

$$
9,
$$

而是：

$$
9-1=8.
$$

所以二维 homography 有：

$$
\boxed{
8\text{ 个自由度}
}
$$

一般地，

$$
(n+1)\times(n+1)
$$

矩阵有：

$$
(n+1)^2
$$

个参数。

去掉整体尺度以后：

$$
\boxed{
(n+1)^2-1
}
$$

个射影自由度。

---

# 15. 为什么 affine transformation 是 projective transformation 的特殊情况？

现在考虑二维仿射变换：

$$
\begin{bmatrix}
X'\\Y'
\end{bmatrix}
=

A
\begin{bmatrix}
X\\Y
\end{bmatrix}
+
\mathbf t.
$$

设：

$$
A=
\begin{bmatrix}
a&b\\
c&d
\end{bmatrix},
\qquad
\mathbf t=
\begin{bmatrix}
t_x\\t_y
\end{bmatrix}.
$$

于是：

$$
X'=aX+bY+t_x,
$$

$$
Y'=cX+dY+t_y.
$$

齐次形式写成：

$$
\begin{bmatrix}
x'\\y'\\w'
\end{bmatrix}
=

\begin{bmatrix}
a&b&t_x\\
c&d&t_y\\
0&0&1
\end{bmatrix}
\begin{bmatrix}
x\\y\\w
\end{bmatrix}.
$$

如果输入已经：

$$
w=1,
$$

那么：

$$
w'=1.
$$

所以完全不需要产生位置相关的透视除法。

于是：

$$
X'=x',
\qquad
Y'=y'.
$$

因此：

$$
\boxed{
\text{affine transformation}
\subset
\text{projective transformation}
}
$$

它就是射影矩阵最后一行为：

$$
\begin{bmatrix}
0&0&1
\end{bmatrix}
$$

的特殊情况。

如果允许矩阵整体缩放，则更一般地最后一行可以等价写成：

$$
\begin{bmatrix}
0&0&\lambda
\end{bmatrix},
\qquad
\lambda\neq0.
$$

---

# 16. 射影变换和仿射变换真正差在哪里？

一般二维射影矩阵是：

$$
H=
\begin{bmatrix}
a&b&t_x\\
c&d&t_y\\
p&q&r
\end{bmatrix}.
$$

对应：

$$
X'
=

\frac{
aX+bY+t_x
}{
pX+qY+r
},
$$

$$
Y'
=

\frac{
cX+dY+t_y
}{
pX+qY+r
}.
$$

如果：

$$
p=q=0,
$$

那么分母：

$$
pX+qY+r=r
$$

是常数。

整体除掉 $r$ 后，就得到仿射变换。

但如果：

$$
(p,q)\neq(0,0),
$$

那么分母依赖于位置：

$$
X,Y.
$$

这时候就出现真正的射影效应：

$$
\boxed{
\text{位置相关的缩放}
}
$$

也就是透视现象的数学来源之一。

---

# 17. 射影变换为什么把直线仍然映射成直线？

这是本章最重要的证明之一。

我们先定义符号。

设原射影直线为：

$$
\mathbf l.
$$

原射影点为：

$$
\mathbf p.
$$

点在线上的条件是：

$$
\mathbf l^{\mathsf T}\mathbf p=0.
$$

现在点经过射影变换：

$$
\mathbf p'
\sim
H\mathbf p.
$$

为了方便推导，我们选一个代表，直接令：

$$
\mathbf p'=H\mathbf p.
$$

因为 $H$ 可逆，所以：

$$
\mathbf p=H^{-1}\mathbf p'.
$$

把它代回原直线方程：

$$
\mathbf l^{\mathsf T}\mathbf p=0.
$$

得到：

$$
\mathbf l^{\mathsf T}
H^{-1}
\mathbf p'
=

0.

$$

现在利用矩阵转置关系。

我们希望把前面那部分写成某个新向量的转置。

注意：

$$
\mathbf l^{\mathsf T}H^{-1}
=

(H^{-T}\mathbf l)^{\mathsf T}.
$$

这里定义：

$$
H^{-T}
=

(H^{-1})^{\mathsf T}.
$$

因此：

$$
(H^{-T}\mathbf l)^{\mathsf T}\mathbf p'
=

0.

$$

定义新直线：

$$
\boxed{
\mathbf l'
=

H^{-T}\mathbf l
}
$$

那么：

$$
\boxed{
\mathbf l'^{\mathsf T}\mathbf p'=0
}
$$

所以所有原本在 $\mathbf l$ 上的点，变换以后全部落在新直线 $\mathbf l'$ 上。

因此：

$$
\boxed{
\text{射影变换把直线映射成直线}
}
$$

这叫：

$$
\boxed{
\text{collineation}
}
$$

即保持共线关系的变换。

---

# 18. 为什么点用 $H$，直线却用 $H^{-T}$？

这个公式特别重要：

$$
\boxed{
\mathbf p'
\sim H\mathbf p
}
$$

而：

$$
\boxed{
\mathbf l'
\sim H^{-T}\mathbf l
}
$$

为什么不是：

$$
\mathbf l'=H\mathbf l?
$$

因为直线不是“普通位置向量”。

它是一个线性函数：

$$
\mathbf p
\mapsto
\mathbf l^{\mathsf T}\mathbf p.
$$

它属于所谓的：

$$
\boxed{
\text{dual space}
}
$$

也就是对偶空间。

当向量按照：

$$
\mathbf p'=H\mathbf p
$$

变化时，为了保持 incidence：

$$
\mathbf l^{\mathsf T}\mathbf p=0,
$$

线性函数必须反向补偿 $H$。

因此自然出现：

$$
H^{-T}.
$$

这个思想以后在：

- 法向量变换；
- plane transformation；
- covector；
- differential forms；

里面都会再次出现。

---

# 19. 我们直接验证 incidence 被保持

设：

$$
\mathbf p'\!=H\mathbf p,
$$

$$
\mathbf l'\!=H^{-T}\mathbf l.
$$

计算：

$$
\mathbf l'^{\mathsf T}\mathbf p'.
$$

代入：

$$
\mathbf l'^{\mathsf T}\mathbf p'
=

(H^{-T}\mathbf l)^{\mathsf T}
(H\mathbf p).
$$

根据转置：

$$
(H^{-T}\mathbf l)^{\mathsf T}
=

\mathbf l^{\mathsf T}H^{-1}.
$$

所以：

$$
\mathbf l'^{\mathsf T}\mathbf p'
=

\mathbf l^{\mathsf T}
H^{-1}
H
\mathbf p.
$$

因为：

$$
H^{-1}H=I,
$$

所以：

$$
\mathbf l'^{\mathsf T}\mathbf p'
=

\mathbf l^{\mathsf T}\mathbf p.
$$

因此如果原来：

$$
\mathbf l^{\mathsf T}\mathbf p=0,
$$

那么：

$$
\mathbf l'^{\mathsf T}\mathbf p'=0.
$$

也就是说：

$$
\boxed{
P\in l
\quad\Longrightarrow\quad
T(P)\in T(l)
}
$$

incidence 被保持。

这其实比“直线变直线”更加本质。

---

# 20. 一般的射影子空间为什么也保持？

假设一个射影子空间来自线性子空间：

$$
W\subset V.
$$

它的射影化是：

$$
\mathbb P(W).
$$

线性变换：

$$
H:V\to V
$$

把 $W$ 映射到：

$$
H(W).
$$

因为 $H$ 可逆，所以：

$$
\dim H(W)=\dim W.
$$

因此：

$$
\mathbb P(W)
$$

会映射到：

$$
\mathbb P(H(W)).
$$

并且维数不变。

所以射影变换不仅：

$$
\text{点}\to\text{点},
$$

$$
\text{线}\to\text{线},
$$

而且一般地：

$$
\boxed{
k\text{维射影子空间}
\longrightarrow
k\text{维射影子空间}
}
$$

---

# 21. 射影变换保持什么？

现在特别重要的是区分：

射影变换会保持某些结构，但不会保持所有我们熟悉的欧氏量。

它保持：

$$
\boxed{
\text{incidence}
}
$$

例如：

点是否在线上。

还保持：

$$
\boxed{
\text{collinearity}
}
$$

即三点是否共线。

也保持：

$$
\boxed{
\text{concurrency}
}
$$

即多条线是否共点。

但是一般**不保持**：

$$
\text{长度},
$$

$$
\text{角度},
$$

$$
\text{面积},
$$

$$
\text{平行性},
$$

$$
\text{中点},
$$

$$
\text{普通比例}.
$$

例如两条原本平行的直线，经过一般射影变换以后可能不再平行。

因为它们共同的无穷远点可能被映射到一个有限点。

---

# 22. 为什么平行性不是射影不变量？

平行线的射影解释是：

> 两条线在无穷远直线上相交。

设无穷远直线为：

$$
\mathbf l_\infty.
$$

一般射影变换会把它映射成：

$$
\mathbf l_\infty'
\sim
H^{-T}\mathbf l_\infty.
$$

一般情况下：

$$
\mathbf l_\infty'
\neq
\mathbf l_\infty.
$$

也就是说：

$$
\boxed{
一般射影变换不会保持我们原先选定的无穷远直线
}
$$

因此原来的无穷远点可以被搬到有限区域。

所以：

$$
\boxed{
\text{平行性不是射影几何中的绝对概念}
}
$$

这一点和我们前面说过的：

> “有限 / 无穷远”依赖于所选仿射图

完全一致。

---

# 23. 仿射变换为什么保持平行线？

因为仿射变换恰恰是那些**保持无穷远超平面**的射影变换。

二维情况下：

$$
\mathbf l_\infty=
\begin{bmatrix}
0\\0\\1
\end{bmatrix}.
$$

仿射矩阵：

$$
H=
\begin{bmatrix}
a&b&t_x\\
c&d&t_y\\
0&0&1
\end{bmatrix}.
$$

我们需要看：

$$
H^{-T}\mathbf l_\infty.
$$

不用完整求逆也可以理解：由于仿射变换满足

$$
w'=w,
$$

所以：

$$
w=0
$$

的点仍然满足：

$$
w'=0.
$$

因此无穷远直线整体不变。

也就是说：

$$
\boxed{
H(H_\infty)=H_\infty
}
$$

因此两个共享无穷远点的平行线，变换后仍然共享某个无穷远点。

所以：

$$
\boxed{
\text{仿射变换保持平行性}
}
$$

这其实是“仿射几何”和“射影几何”之间最深的结构差异之一。

---

# 24. 从这个角度看几何层级

现在可以建立一条非常漂亮的层级：

$$
\boxed{
\text{Euclidean}
\subset
\text{Similarity}
\subset
\text{Affine}
\subset
\text{Projective}
}
$$

越往右：

允许的变换越多，

保持的不变量越少。

例如：

欧氏变换保持长度、角度。

相似变换不保持绝对长度，但保持角度和长度比例。

仿射变换不保持角度，但保持平行性和仿射比例。

射影变换连平行性都不保持，但仍保持 incidence 和之后要讲的 **cross ratio**。

这就是所谓的：

$$
\boxed{
\text{Erlangen viewpoint}
}
$$

即：

> 一个几何学可以通过“允许什么变换、在这些变换下什么性质保持不变”来理解。

---

# 25. 射影变换的复合为什么还是射影变换？

设：

$$
T_A([\mathbf x])
=

[A\mathbf x],
$$

以及：

$$
T_B([\mathbf x])
=

[B\mathbf x].
$$

先作用 $A$，再作用 $B$：

$$
[\mathbf x]
\longmapsto
[A\mathbf x]
\longmapsto
[B(A\mathbf x)].
$$

根据矩阵乘法结合律：

$$
B(A\mathbf x)
=

(BA)\mathbf x.
$$

所以复合变换是：

$$
\boxed{
T_B\circ T_A
=

T_{BA}
}
$$

由于：

$$
A,B
$$

都可逆，所以：

$$
BA
$$

也可逆。

因此射影变换对复合封闭。

---

# 26. 逆变换也自然存在

如果：

$$
\mathbf x'
\sim H\mathbf x,
$$

因为 $H$ 可逆：

$$
\mathbf x
\sim H^{-1}\mathbf x'.
$$

所以逆射影变换由：

$$
\boxed{
H^{-1}
}
$$

表示。

于是射影变换确实组成一个群：

$$
PGL(n+1,\mathbb R).
$$

这不是只为了抽象漂亮。

它告诉我们射影变换具备：

- 可以复合；
- 有恒等变换；
- 每个变换可逆；
- 复合满足结合律。

---

# 27. 一个具体二维 homography 例子

我们看：

$$
H=
\begin{bmatrix}
1&0&0\\
0&1&0\\
\frac12&0&1
\end{bmatrix}.
$$

考虑普通点：

$$
(X,Y).
$$

齐次表示：

$$
\mathbf p=
\begin{bmatrix}
X\\Y\\1
\end{bmatrix}.
$$

先乘矩阵：

$$
H\mathbf p
=

\begin{bmatrix}
X\\
Y\\
\frac12X+1
\end{bmatrix}.
$$

所以：

$$
x'=X,
$$

$$
y'=Y,
$$

$$
w'=\frac12X+1.
$$

做齐次除法：

$$
X'
=

\frac{X}
{1+\frac12X},
$$

$$
Y'
=

\frac{Y}
{1+\frac12X}.
$$

注意缩放因子依赖于 $X$。

所以右边不同位置会产生不同程度的缩放。

这已经是真正的透视型变换了。

---

# 28. 有些有限点会被送到无穷远

仍然使用：

$$
H=
\begin{bmatrix}
1&0&0\\
0&1&0\\
\frac12&0&1
\end{bmatrix}.
$$

输出齐次分量：

$$
w'
=

\frac12X+1.
$$

什么时候：

$$
w'=0?
$$

解：

$$
\frac12X+1=0.
$$

所以：

$$
X=-2.
$$

因此整条普通仿射直线：

$$
X=-2
$$

上的点会满足：

$$
w'=0.
$$

所以它们被送到输出空间的无穷远直线上。

这说明：

$$
\boxed{
一般射影变换可以把有限对象送到无穷远
}
$$

反过来也可以把无穷远对象送到有限区域。

这正是它比仿射变换更一般的地方。

---

# 29. 但射影空间本身没有发生“爆炸”

在仿射公式：

$$
X'
=

\frac{X}{1+\frac12X}
$$

中，当：

$$
X=-2
$$

时分母为零。

从普通实数坐标来看，好像“函数炸了”。

但在齐次坐标里完全没有问题。

输入：

$$
[-2:Y:1].
$$

变换后：

$$
H
\begin{bmatrix}
-2\\Y\\1
\end{bmatrix}
=

\begin{bmatrix}
-2\\Y\\0
\end{bmatrix}.
$$

这是完全合法的射影点：

$$
[-2:Y:0].
$$

只是不能落在：

$$
w'=1
$$

这张仿射图里面而已。

所以所谓“分母为零”很多时候不是射影空间出了问题，而只是：

$$
\boxed{
当前 affine chart 覆盖不到那个点
}
$$

这和球面坐标、地图投影中的坐标奇点思想非常类似。

---

# 30. 这也是齐次坐标最强大的思想之一

普通坐标公式可能出现：

$$
\frac{1}{0}.
$$

但齐次坐标里不一定真的有奇异性。

因为：

$$
[x:y:0]
$$

仍然是合法的射影点。

所以我们可以说：

$$
\boxed{
齐次坐标把很多仿射公式中的“无穷大”
转化成普通的有限齐次向量
}
$$

例如：

$$
X'\to\infty
$$

对应的可能只是：

$$
[x':w']=[1:0].
$$

没有任何数值意义上的“无限大坐标”是必须存储的。

---

# 31. homography 和 projective transformation 是不是同一个词？

在很多计算机视觉与图形学语境中，它们经常混用。

不过稍微严格一点：

**projective transformation** 是更一般的概念。

例如：

$$
\mathbb P^n\to\mathbb P^n.
$$

而 **homography** 通常特别强调：

> 两个射影空间/射影平面之间的可逆射影映射。

在计算机视觉里，“homography”尤其经常指：

$$
\mathbb P^2\to\mathbb P^2
$$

的 $3\times3$ 可逆矩阵映射：

$$
\mathbf p'\sim H\mathbf p.
$$

因此以后看到：

$$
\boxed{
\text{2D homography}
}
$$

基本就应该想到：

$$
\boxed{
3\times3
\text{ 可逆矩阵，只定义到整体尺度}
}
$$

---

# 32. 四个点为什么可以确定二维 homography？

这个问题先建立直觉，下一章之后还可以正式做 DLT 推导。

二维 homography：

$$
H
$$

有 $9$ 个矩阵元素。

但整体尺度无意义，所以有效自由度：

$$
8.
$$

一个点对应关系：

$$
(X,Y)
\longleftrightarrow
(X',Y')
$$

提供两个独立标量约束。

因此四组点对应大致提供：

$$
4\times2=8
$$

个约束。

所以在一般位置下：

$$
\boxed{
4\text{ 组点对应可以确定一个二维 homography}
}
$$

当然还需要避免退化情况，例如四个点全部共线。

这就是图像透视校正、平面配准等算法的基础。

---

# 33. 射影变换为什么非常适合描述相机？

先只给一个预告。

三维世界点可以写成：

$$
\mathbf X=
\begin{bmatrix}
X\\Y\\Z\\1
\end{bmatrix}.
$$

相机图像点写成：

$$
\mathbf x=
\begin{bmatrix}
x\\y\\w
\end{bmatrix}.
$$

透视相机可以写成：

$$
\boxed{
\mathbf x\sim P\mathbf X
}
$$

其中：

$$
P
$$

是：

$$
3\times4
$$

相机矩阵。

然后得到：

$$
u=\frac{x}{w},
\qquad
v=\frac{y}{w}.
$$

你应该已经能看出来：

这还是同一个模式：

$$
\boxed{
\text{高维线性运算}
\longrightarrow
\text{齐次除法}
\longrightarrow
\text{分式关系}
}
$$

只不过这里 $P$ 不是方阵，所以它不是：

$$
\mathbb P^3\to\mathbb P^3
$$

的射影自同构，而是：

$$
\mathbb P^3\to\mathbb P^2
$$

的投影映射。

我们后面专门讲。

---

# 34. 现在把这一章最核心的结构串起来

前面我们建立了：

$$
\mathbf x
\sim
\lambda\mathbf x.
$$

因此线性变换：

$$
\mathbf x\mapsto H\mathbf x
$$

能够自然下降到射影空间：

$$
[\mathbf x]
\mapsto
[H\mathbf x].
$$

为了让每一个射影点都合法映射，要求：

$$
H
$$

可逆：

$$
H\in GL(n+1,\mathbb R).
$$

但因为：

$$
H
\sim
\lambda H,
$$

所以真正的变换群是：

$$
\boxed{
PGL(n+1,\mathbb R)
}
$$

而在仿射坐标中，它表现成：

$$
\boxed{
X_i'
=

\frac{\text{线性函数}}
{\text{同一个线性函数}}
}
$$

例如二维：

$$
X'
=

\frac{
h_{11}X+h_{12}Y+h_{13}
}{
h_{31}X+h_{32}Y+h_{33}
},
$$

$$
Y'
=

\frac{
h_{21}X+h_{22}Y+h_{23}
}{
h_{31}X+h_{32}Y+h_{33}
}.
$$

与此同时：

$$
\boxed{
\mathbf p'
\sim H\mathbf p
}
$$

而直线则按照：

$$
\boxed{
\mathbf l'
\sim H^{-T}\mathbf l
}
$$

变化。

所以 incidence：

$$
\mathbf l^{\mathsf T}\mathbf p=0
$$

被保持。

这就是为什么：

$$
\boxed{
\text{射影变换把直线映射成直线}
}
$$

---

# 35. 现在你可以第一次把前面几章真正统一起来

我们已经有了这样一条完整逻辑链：

$$
\mathbb R^{n+1}
$$

中的非零向量

$$
\downarrow\ /\sim
$$

变成

$$
\mathbb P^n
$$

中的射影点。

然后：

$$
H\in GL(n+1)
$$

在线性空间中做：

$$
\mathbf x\mapsto H\mathbf x.
$$

由于它兼容：

$$
\mathbf x\sim\lambda\mathbf x,
$$

所以产生射影变换：

$$
[\mathbf x]
\mapsto
[H\mathbf x].
$$

再选择仿射图：

$$
w\neq0,
$$

并做：

$$
w=1
$$

归一化，就得到：

$$
\boxed{
\text{fractional linear transformation}
}
$$

所以：

$$
\boxed{
\text{射影变换}
=

\text{更高维线性变换在射影商空间中的投影}
}
$$

这句话已经非常接近整个射影几何的核心了。

---

下一章我建议紧接着讲 **Cross Ratio（交比）和射影不变量**。

因为我们现在已经知道：

$$
\text{长度不保持},
$$

$$
\text{角度不保持},
$$

$$
\text{平行性也不保持}.
$$

自然就会出现最重要的问题：

$$
\boxed{
那射影变换到底还保持什么“数值量”？
}
$$

答案就是交比。

而且交比会第一次让你真正看到为什么

$$
X\mapsto\frac{aX+b}{cX+d}
$$

虽然能把点的位置扭曲得非常厉害，却仍然保存一种极其精确的四点比例关系。之后再讲透视投影、vanishing point、相机矩阵，会顺很多。
