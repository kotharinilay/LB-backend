cd /tmp
git clone --recursive https://github.com/skvark/opencv-python.git
cd opencv-python
export CMAKE_ARGS="-DOPENCV_ENABLE_NONFREE=ON -DWITH_TBB=ON -DWITH_CUDA=ON -DWITH_CUDNN=ON -DOPENCV_DNN_CUDA=ON -DCUDA_ARCH_BIN=7.5 -DBUILD_opencv_cudacodec=OFF -DENABLE_FAST_MATH=1 -DCUDA_FAST_MATH=1 -DWITH_CUBLAS=1 -DWITH_V4L=ON -DWITH_QT=OFF -DWITH_OPENGL=ON -DWITH_GSTREAMER=ON -DOPENCV_GENERATE_PKGCONFIG=ON -DOPENCV_ENABLE_NONFREE=ON -DOPENCV_EXTRA_MODULES_PATH=/tmp/opencv-python/opencv_contrib/modules"
python3 setup.py bdist_wheel
cd dist
pip3 install opencv_python-4.3.0+3073e9e-cp36-cp36m-linux_x86_64.whl
# cd /tmp/
# wget https://wizardlabs-lamda-layers.s3.us-east-2.amazonaws.com/opencv_python-4.3.0%2B3073e9e-cp36-cp36m-linux_x86_64.whl
# pip3 install opencv_python-4.3.0+3073e9e-cp36-cp36m-linux_x86_64.whl
# rm opencv_python-4.3.0+3073e9e-cp36-cp36m-linux_x86_64.whl
# bash -c 'echo "/usr/local/lib" > /etc/ld.so.conf.d/opencv.conf'
# ldconfig