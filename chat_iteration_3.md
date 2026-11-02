
# 35. 为什么射影子空间和线性子空间关系这么紧？

因为射影空间本身就是从线性空间：

$$
V\setminus\{0\}
$$

通过缩放等价关系：

$$
\mathbf v\sim\lambda\mathbf v
$$

构造出来的。

所以：

$$
W\subseteq V
$$

只要是线性子空间，

它里面的非零向量也天然可以取射影等价类。

于是：

$$
W
$$

自然产生：

$$
\mathbb P(W).
$$

所以：

$$
\boxed{
射影子空间本质上就是线性子空间“去掉整体尺度”后的结果
}
$$

---

# 36. 仿射子空间又是怎样藏在射影子空间中的？

这是另外一个非常漂亮的关系。

比如在：

$$
\mathbb P^2
$$

中取一条射影直线：

$$
ax+by+cw=0.
$$

在：

$$
w\neq0
$$

的仿射图中，除以 $w$：

$$
a\frac{x}{w}
+
b\frac{y}{w}
+
c
=

0.

$$

定义：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

得到：

$$
aX+bY+c=0.
$$

这就是普通仿射直线。

所以：

$$
\boxed{
射影子空间
\cap
\text{仿射图}
=

\text{仿射子空间}
}
$$

这是非常重要的结构关系。

---

# 37. 无穷远超平面重新出现了

在：

$$
\mathbb P^n
$$

里，我们通常选择最后一个齐次坐标：

$$
w.
$$

仿射区域定义为：

$$
w\neq0.
$$

而：

$$
w=0
$$

定义一个射影超平面。

因为它就是一次齐次方程：

$$
0x_1+\cdots+0x_n+1w=0.
$$

因此：

$$
\boxed{
H_\infty:
w=0
}
$$

是一个射影超平面。

它叫：

$$
\boxed{
\text{hyperplane at infinity}
}
$$

即：

$$
\boxed{
\text{无穷远超平面}
}
$$

---

# 38. 无穷远超平面的维数是多少？

$$
\mathbb P^n
$$

维数为：

$$
n.
$$

一个超平面维数：

$$
n-1.
$$

所以：

$$
H_\infty
\cong
\mathbb P^{n-1}.
$$

于是：

$$
\boxed{
\mathbb P^n
=

\mathbb R^n
\cup
\mathbb P^{n-1}_{\infty}
}
$$

这个公式现在应该比前面看起来更自然了。

不是说“硬塞进一个无穷远东西”。

而是：

> 选择一个射影超平面作为无穷远超平面后，它的补集就形成一个仿射空间。

---

# 39. 一个很重要的概念：余维数

设：

$$
W\subseteq V.
$$

定义：

$$
\boxed{
\operatorname{codim}W
=

\dim V-\dim W
}
$$

叫做：

$$
\boxed{
\text{codimension}
}
$$

中文：

$$
\boxed{
\text{余维数}
}
$$

例如在：

$$
\mathbb R^3
$$

中，一条直线维数是：

$$
1.
$$

所以余维数：

$$
3-1=2.
$$

一个平面维数：

$$
2.
$$

余维数：

$$
3-2=1.
$$

所以平面是超平面。

因为超平面的定义就是：

$$
\boxed{
\operatorname{codim}=1
}
$$

---

# 40. 为什么一个方程通常降低一个维度？

考虑：

$$
\mathbb R^{n+1}.
$$

一个非零线性方程：

$$
a_0x_0+\cdots+a_nx_n=0
$$

可以写成：

$$
\mathbf a^{\mathsf T}\mathbf x=0.
$$

这里线性映射：

$$
L:\mathbb R^{n+1}\to\mathbb R
$$

定义为：

$$
L(\mathbf x)=\mathbf a^{\mathsf T}\mathbf x.
$$

因为：

$$
\mathbf a\neq0,
$$

所以：

$$
\operatorname{rank}L=1.
$$

根据秩-零化度定理：

$$
\dim(\ker L)
+
\operatorname{rank}L
=

n+1.
$$

因此：

$$
\dim(\ker L)+1=n+1.
$$

所以：

$$
\dim(\ker L)=n.
$$

因此一个非零独立线性方程，把：

$$
n+1
$$

维空间限制成：

$$
n
$$

维线性子空间。

射影化以后：

$$
n\mapsto n-1.
$$

所以：

$$
a_0x_0+\cdots+a_nx_n=0
$$

在：

$$
\mathbb P^n
$$

里定义：

$$
n-1
$$

维射影子空间。

也就是超平面。

---

# 41. 两个独立线性方程会怎样？

假设在：

$$
\mathbb P^3
$$

中有：

$$
a_1x+b_1y+c_1z+d_1w=0,
$$

和：

$$
a_2x+b_2y+c_2z+d_2w=0.
$$

如果两方程线性独立，那么在底层：

$$
\mathbb R^4
$$

中，它们把维数从：

$$
4
$$

降低到：

$$
2.
$$

因为矩阵秩是：

$$
2.
$$

于是解空间维数：

$$
4-2=2.
$$

射影化以后：

$$
2-1=1.
$$

因此：

$$
\boxed{
\mathbb P^3
\text{ 中两个不同射影平面的交集通常是一条射影直线}
}
$$

这就是三维射影几何里：

$$
\boxed{
\text{两个平面交于一条线}
}
$$

的线性代数本质。

---

# 42. 三个独立平面呢？

仍然在：

$$
\mathbb P^3.
$$

三个独立线性方程对应一个秩为：

$$
3
$$

的线性系统。

底层：

$$
\mathbb R^4
$$

中的零空间维数：

$$
4-3=1.
$$

射影化：

$$
1-1=0.
$$

所以：

$$
\boxed{
三个独立射影平面通常交于一个射影点
}
$$

又一次：

$$
\text{几何相交}
$$

完全变成了：

$$
\text{零空间维数计算}.
$$

---

# 43. 一般交集的维数公式

这里可以再往前一步。

设：

$$
A,B
$$

是向量空间 $V$ 的两个线性子空间。

我们有维数公式：

$$
\boxed{
\dim(A+B)
=

\dim A+\dim B-\dim(A\cap B)
}
$$

所以：

$$
\dim(A\cap B)
=

\dim A+\dim B-\dim(A+B).
$$

因为：

$$
A+B\subseteq V,
$$

所以：

$$
\dim(A+B)\leq\dim V.
$$

因此：

$$
\dim(A\cap B)
\geq
\dim A+\dim B-\dim V.
$$

这是很多“为什么射影对象一定相交”的根本原因。

---

# 44. 用它解释 $\mathbb P^2$ 中两条直线一定相交

$$
\mathbb P^2
$$

的底层空间是：

$$
V=\mathbb R^3.
$$

两条射影直线对应两个二维线性子空间：

$$
A,B\subseteq\mathbb R^3.
$$

所以：

$$
\dim A=2,
$$

$$
\dim B=2.
$$

因此：

$$
\dim(A\cap B)
\geq
2+2-3.
$$

所以：

$$
\dim(A\cap B)\geq1.
$$

如果两条射影直线不同，那么：

$$
A\neq B,
$$

所以交集不可能是二维。

因此：

$$
\dim(A\cap B)=1.
$$

一个一维线性子空间射影化以后是：

$$
0
$$

维射影空间，也就是一个点。

所以：

$$
\boxed{
两条不同射影直线恰好交于一个射影点
}
$$

这比“叉积算出来一个点”更深一层。

---

# 45. 再解释 $\mathbb P^3$ 中两条直线为什么可能不相交

这是一个很好的对照。

在：

$$
\mathbb P^3
$$

中，一条射影直线仍然对应二维线性子空间。

但底层环境变成：

$$
\mathbb R^4.
$$

所以：

$$
\dim(A\cap B)
\geq
2+2-4.
$$

即：

$$
\dim(A\cap B)\geq0.
$$

这个下界允许：

$$
\dim(A\cap B)=0.
$$

而线性子空间的零维交集就是：

$$
A\cap B=\{\mathbf0\}.
$$

但是：

$$
\mathbf0
$$

不能代表射影点。

所以射影化以后：

$$
\mathbb P(A)\cap\mathbb P(B)
=

\varnothing.
$$

因此：

$$
\boxed{
\mathbb P^3
\text{ 中两条射影直线仍然可能不相交}
}
$$

这就是所谓：

$$
\boxed{
\text{skew lines}
}
$$

异面直线。

所以要非常注意：

$$
\boxed{
“任意两条射影直线都相交”
}
$$

只在：

$$
\mathbb P^2
$$

这种射影平面中成立。

不是所有：

$$
\mathbb P^n
$$

都成立。

---

# 46. 这也是“平行”和“异面”完全不同的原因

普通三维空间里，两条不相交直线有两种可能：

平行，或者异面。

平行直线在射影化之后：

$$
\boxed{
会在无穷远点相交
}
$$

所以“不相交”的平行情形被消除了。

但是异面直线没有共同方向，也没有共同有限点。

因此即使射影化：

$$
\boxed{
它们仍然不相交
}
$$

这是一个非常重要的区别。

---

# 47. 射影子空间的维数公式

现在可以总结一个非常核心的转换公式。

设：

$$
V
$$

是一个维数为：

$$
n+1
$$

的向量空间。

于是：

$$
\dim\mathbb P(V)=n.
$$

若：

$$
W\subseteq V
$$

且：

$$
\dim W=k+1,
$$

那么：

$$
\boxed{
\dim\mathbb P(W)=k
}
$$

因此：

$$
\boxed{
\text{射影维数}
=

\text{线性维数}-1
}
$$

这个式子以后要形成条件反射。

---

# 48. 现在把线性、仿射、射影三种子空间统一起来

我们可以这样看：

在线性几何中：

$$
W\subseteq\mathbb R^{n+1}
$$

是线性子空间。

它必须：

$$
\mathbf0\in W.
$$

在射影几何中：

$$
\mathbb P(W)
$$

把 $W$ 中所有穿过原点的方向压成射影点。

而选择某个仿射图，比如：

$$
w=1,
$$

以后：

$$
\mathbb P(W)\cap\{w=1\}
$$

就会变成普通仿射子空间。

所以有一条非常重要的链：

$$
\boxed{
\text{线性子空间}
\longrightarrow
\text{射影子空间}
\longrightarrow
\text{仿射子空间}
}
$$

更具体地说：

$$
W
\subseteq
\mathbb R^{n+1}
$$

先取射影化：

$$
\mathbb P(W),
$$

然后选择：

$$
w\neq0
$$

这张仿射图，再规范化：

$$
w=1,
$$

就得到一个仿射子空间。

---

# 49. 一个特别重要的二维例子

考虑仿射直线：

$$
Y=2X+3.
$$

写成：

$$
2X-Y+3=0.
$$

齐次化：

$$
2x-y+3w=0.
$$

这是：

$$
\mathbb R^3
$$

中的二维线性子空间：

$$
W
=

\left\{
(x,y,w):
2x-y+3w=0
\right\}.
$$

注意，它经过：

$$
(0,0,0).
$$

射影化：

$$
\mathbb P(W)
$$

是一条：

$$
\mathbb P^2
$$

中的射影直线。

然后取：

$$
w=1.
$$

得到：

$$
2X-Y+3=0.
$$

于是重新得到：

$$
Y=2X+3.
$$

所以整个过程是：

$$
\boxed{
\mathbb R^3
\text{ 中二维线性子空间}
}
$$

$$
\downarrow
$$

$$
\boxed{
\mathbb P^2
\text{ 中一维射影直线}
}
$$

$$
\downarrow\quad w=1
$$

$$
\boxed{
\mathbb R^2
\text{ 中一维仿射直线}
}
$$

这三者其实是同一个几何结构从三个不同层面观察的结果。

---

# 50. 最后把这一章真正的骨架压缩出来

这一章最关键的结论可以浓缩为下面这一组：

$$
\boxed{
F(\lambda\mathbf x)
=

\lambda^dF(\mathbf x)
}
$$

定义 $d$ 次齐次函数。

因为射影点满足：

$$
\mathbf x\sim\lambda\mathbf x,
$$

所以齐次方程：

$$
F(\mathbf x)=0
$$

能够良定义地描述射影对象。

而：

$$
\boxed{
\mathbb P(W)
=

(W\setminus\{0\})/\sim
}
$$

把线性子空间 $W$ 射影化。

若：

$$
\dim W=k+1,
$$

则：

$$
\boxed{
\dim\mathbb P(W)=k
}
$$

特别地：

$$
\boxed{
\text{点}
\leftrightarrow
1\text{维线性子空间}
}
$$

$$
\boxed{
\text{射影直线}
\leftrightarrow
2\text{维线性子空间}
}
$$

$$
\boxed{
\text{射影平面}
\leftrightarrow
3\text{维线性子空间}
}
$$

而在：

$$
\mathbb P^n
$$

中，超平面是：

$$
n-1
$$

维射影子空间，由一次齐次方程：

$$
\boxed{
a_0x_0+\cdots+a_nx_n=0
}
$$

定义。

最值得你现在形成的整体图景是：

$$
\boxed{
\begin{array}{c}
\mathbb R^{n+1}
\\[4pt]
\text{线性空间}
\\[4pt]
\downarrow\text{ 除掉整体尺度}
\\[4pt]
\mathbb P^n
\\[4pt]
\text{射影空间}
\\[4pt]
\downarrow\text{ 选择 }w\neq0,\text{ 规范化 }w=1
\\[4pt]
\mathbb R^n
\\[4pt]
\text{仿射空间}
\end{array}
}
$$

而“齐次”正是让这三个世界能够彼此兼容的语言。
